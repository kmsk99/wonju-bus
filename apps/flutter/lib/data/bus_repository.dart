import 'dart:async';
import 'dart:collection';
import 'dart:convert';

import 'package:flutter/services.dart';

import '../models/bus_models.dart';
import '../utils/day_type_utils.dart';

/// Aggregated departure information used by stop detail screens.
class DepartureRecord {
  DepartureRecord({
    required this.routeNumber,
    required this.departureTime,
    required this.nextDepartureMinutes,
    required this.category,
    required this.isFromTerminal,
    this.isNextDay = false,
    this.tripIndex,
  });

  final String routeNumber;
  final String departureTime;
  final int nextDepartureMinutes;
  final String category;
  final bool isFromTerminal;
  final bool isNextDay;
  final int? tripIndex;
}

/// High-level summary for departure cards grouped by route.
class GroupedDeparture {
  GroupedDeparture({
    required this.nextDeparture,
    required this.remainingCount,
    required this.operatesToday,
  });

  final DepartureRecord nextDeparture;
  final int remainingCount;
  final bool operatesToday;
}

/// Repository that mirrors the data access patterns from the original React implementation.
class BusRepository {
  BusRepository._();

  static final BusRepository instance = BusRepository._();

  final Map<String, BusData> _busDataByRoute = {};
  final Map<String, List<String>> _busFilesByBaseRoute = {};
  final Map<String, Set<String>> _actualRouteNumbersByBase = {};
  final Map<String, BusFileInfo> _fileInfoByActualRoute = {};
  final Map<String, List<String>> _routesByTerminal = {};
  final Map<String, List<String>> _routesToTerminal = {};
  final Map<String, int> _routeCountsByTerminal = {};

  List<String>? _terminalCache;
  Future<List<BusData>>? _loadAllFuture;
  bool _isVacation = false;
  bool _isHoliday = false;

  /// Returns a snapshot of bus data loaded from all asset files.
  Future<List<BusData>> loadAllBusData() {
    _loadAllFuture ??= _loadAllBusDataInternal();
    return _loadAllFuture!;
  }

  /// Internal loader that walks through every bus data file.
  Future<List<BusData>> _loadAllBusDataInternal() async {
    final fileNames = await _resolveBusFileList();

    final results = <BusData>[];

    for (final fileName in fileNames) {
      try {
        final fileInfo = parseBusFileName(fileName);
        final assetPath = 'assets/data/${fileInfo.fileName}';
        final rawBus = await rootBundle.loadString(assetPath);
        final busData = BusData.decode(rawBus)
          ..fileName = fileInfo.fileName
          ..operatesToday = isDayTypeMatch(
            fileInfo.dayTypeGroup,
            isVacation: _isVacation,
            isHoliday: _isHoliday,
          );

        final actualRoute = busData.routeInfo.routeNumber;
        results.add(busData);
        _busDataByRoute[actualRoute] = busData;

        _busFilesByBaseRoute
            .putIfAbsent(fileInfo.routeNumber, () => <String>[])
            .add(fileInfo.fileName);

        _actualRouteNumbersByBase
            .putIfAbsent(fileInfo.routeNumber, () => <String>{})
            .add(actualRoute);

        _fileInfoByActualRoute[actualRoute] = fileInfo;
      } catch (error) {
        // Keep behavior resilient: log to console and proceed.
        // ignore: avoid_print
        print('Failed to load $fileName: $error');
      }
    }

    return results;
  }

  /// Retrieves a single route dataset.
  Future<BusData?> loadBusData(String routeNumber) async {
    if (_busDataByRoute.containsKey(routeNumber)) {
      return _busDataByRoute[routeNumber];
    }

    await loadAllBusData();

    final cached = _busDataByRoute[routeNumber];
    if (cached != null) {
      return cached;
    }

    // Fallback: try resolving the base route form (without qualifiers).
    final baseMatch = _actualRouteNumbersByBase[routeNumber];
    if (baseMatch != null && baseMatch.isNotEmpty) {
      final resolvedKey = baseMatch.first;
      return _busDataByRoute[resolvedKey];
    }

    try {
      return _busDataByRoute.values.firstWhere(
        (data) => data.routeInfo.routeNumber.startsWith(routeNumber),
      );
    } catch (_) {
      return null;
    }
  }

  /// Returns whether a route operates on the current day.
  Future<bool> isRouteOperatingToday(String routeNumber) async {
    final busData = await loadBusData(routeNumber);
    if (busData == null) {
      return false;
    }

    if (busData.operatesToday != null) {
      return busData.operatesToday!;
    }

    final fileInfo = _fileInfoByActualRoute[busData.routeInfo.routeNumber];
    if (fileInfo != null &&
        isDayTypeMatch(
          fileInfo.dayTypeGroup,
          isVacation: _isVacation,
          isHoliday: _isHoliday,
        )) {
      return true;
    }

    if (busData.operationInfo.isNotEmpty) {
      final currentDayTypes = getCurrentDayTypes(
        isVacation: _isVacation,
        isHoliday: _isHoliday,
      );
      final hasMatch = busData.operationInfo.any(
        (op) =>
            currentDayTypes.contains(op.category) || op.category.trim() == '공통',
      );
      return hasMatch;
    }

    return true;
  }

  /// Loads all terminal names sorted by the number of associated routes.
  Future<List<String>> loadTerminals() async {
    if (_terminalCache != null) {
      return _terminalCache!;
    }

    final allData = await loadAllBusData();
    final terminalSet = <String>{};
    final routeCount = <String, int>{};

    for (final bus in allData) {
      for (final operation in bus.operationInfo) {
        if (operation.departureName != '-') {
          terminalSet.add(operation.departureName);
          routeCount.update(operation.departureName, (value) => value + 1,
              ifAbsent: () => 1);
        }
        if (operation.arrivalName != '-') {
          terminalSet.add(operation.arrivalName);
          routeCount.update(operation.arrivalName, (value) => value + 1,
              ifAbsent: () => 1);
        }
      }
    }

    _routeCountsByTerminal
      ..clear()
      ..addAll(routeCount);

    final sortedTerminals = terminalSet.toList()
      ..sort(
        (a, b) => (routeCount[b] ?? 0).compareTo(routeCount[a] ?? 0),
      );

    _terminalCache = sortedTerminals;
    return sortedTerminals;
  }

  /// Returns the number of routes connected to a terminal.
  int getRouteCountForTerminal(String terminalName) {
    return _routeCountsByTerminal[terminalName] ?? 0;
  }

  /// Retrieves routes that depart from the given terminal.
  Future<List<String>> loadRoutesByTerminal(String terminalName) async {
    if (_routesByTerminal.containsKey(terminalName)) {
      return _routesByTerminal[terminalName]!;
    }

    final allData = await loadAllBusData();
    final matching = <String>[];

    for (final bus in allData) {
      final hasDeparture = bus.operationInfo
          .any((op) => op.departureName.trim() == terminalName);
      if (hasDeparture) {
        matching.add(bus.routeInfo.routeNumber);
      }
    }

    _routesByTerminal[terminalName] = matching;
    return matching;
  }

  /// Retrieves routes that arrive at the given terminal.
  Future<List<String>> loadRoutesToTerminal(String terminalName) async {
    if (_routesToTerminal.containsKey(terminalName)) {
      return _routesToTerminal[terminalName]!;
    }

    final allData = await loadAllBusData();
    final matching = <String>[];

    for (final bus in allData) {
      final hasArrival = bus.operationInfo
          .any((op) => op.arrivalName.trim() == terminalName);
      if (hasArrival) {
        matching.add(bus.routeInfo.routeNumber);
      }
    }

    _routesToTerminal[terminalName] = matching;
    return matching;
  }

  /// Aggregates departure entries for a stop combining departures and arrivals.
  Future<List<DepartureRecord>> getAllDepartureTimesFromStop(
      String stopName) async {
    final departureRoutes = await loadRoutesByTerminal(stopName);
    final arrivalRoutes = await loadRoutesToTerminal(stopName);
    final allRoutes = <String>{...departureRoutes, ...arrivalRoutes};

    final results = <DepartureRecord>[];

    final now = DateTime.now();

    for (final route in allRoutes) {
      final busData = await loadBusData(route);
      if (busData == null) {
        continue;
      }

      final tempTimes = <Map<String, dynamic>>[];

      for (var index = 0; index < busData.operationInfo.length; index++) {
        final op = busData.operationInfo[index];
        final tripIndex = index + 1;

        if (op.departureName == stopName && op.departureTime != '-') {
          tempTimes.add({
            'time': op.departureTime,
            'category': op.category,
            'isFromTerminal': true,
            'tripIndex': tripIndex,
          });
        }

        if (op.arrivalName == stopName && op.arrivalTime != '-') {
          tempTimes.add({
            'time': op.arrivalTime,
            'category': op.category,
            'isFromTerminal': false,
            'tripIndex': tripIndex,
          });
        }
      }

      tempTimes.sort((a, b) {
        final aMinutes = _toMinutes(a['time'] as String);
        final bMinutes = _toMinutes(b['time'] as String);
        return aMinutes.compareTo(bMinutes);
      });

      for (final entry in tempTimes) {
        final timeText = entry['time'] as String;
        final scheduled = _scheduleDateTime(timeText, reference: now);
        var isNextDay = false;
        var nextMinutes = scheduled.difference(now).inMinutes;

        if (nextMinutes < 0) {
          final adjusted = scheduled.add(const Duration(days: 1));
          nextMinutes = adjusted.difference(now).inMinutes;
          isNextDay = true;
        }

        results.add(
          DepartureRecord(
            routeNumber: busData.routeInfo.routeNumber,
            departureTime: timeText,
            nextDepartureMinutes: nextMinutes,
            category: entry['category'] as String? ?? '공통',
            isFromTerminal: entry['isFromTerminal'] as bool? ?? true,
            isNextDay: isNextDay,
            tripIndex: entry['tripIndex'] as int?,
          ),
        );
      }
    }

    results.sort(
      (a, b) => _toMinutes(a.departureTime).compareTo(
        _toMinutes(b.departureTime),
      ),
    );

    return results;
  }

  /// Groups departure information by route similar to the React implementation.
  Future<Map<String, GroupedDeparture>> groupDeparturesByRoute(
      String stopName) async {
    final departures = await getAllDepartureTimesFromStop(stopName);
    final grouped = SplayTreeMap<String, GroupedDeparture>();

    final routes = departures.map((d) => d.routeNumber).toSet();

    for (final route in routes) {
      final routeDepartures =
          departures.where((d) => d.routeNumber == route).toList()
            ..sort(
              (a, b) => _toMinutes(a.departureTime)
                  .compareTo(_toMinutes(b.departureTime)),
            );

      final remainingToday = routeDepartures
          .where((d) => !d.isNextDay && d.nextDepartureMinutes >= 0)
          .toList();

      final nextDay = routeDepartures.where((d) => d.isNextDay).toList();

      DepartureRecord nextDeparture;
      if (remainingToday.isNotEmpty) {
        nextDeparture = remainingToday.first;
      } else if (nextDay.isNotEmpty) {
        nextDeparture = nextDay.first;
      } else {
        nextDeparture = routeDepartures.first;
      }

      final operatesToday = await isRouteOperatingToday(route);

      grouped[route] = GroupedDeparture(
        nextDeparture: nextDeparture,
        remainingCount:
            operatesToday ? remainingToday.length : 0, // matches web behavior
        operatesToday: operatesToday,
      );
    }

    return grouped;
  }

  static int _toMinutes(String time) {
    final cleaned = time.trim();
    if (cleaned.isEmpty || cleaned == '-') {
      return 0;
    }

    final parts = cleaned.split(':');
    final hours = int.tryParse(parts[0]) ?? 0;
    final minutes = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    return hours * 60 + minutes;
  }

  static DateTime _scheduleDateTime(
    String timeText, {
    DateTime? reference,
  }) {
    final now = reference ?? DateTime.now();

    final cleaned = timeText.trim();
    if (cleaned.isEmpty || cleaned == '-') {
      return DateTime(now.year, now.month, now.day);
    }

    final parts = cleaned.split(':');
    final hours = int.tryParse(parts[0]) ?? 0;
    final minutes = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    return DateTime(now.year, now.month, now.day, hours, minutes);
  }

  Future<List<String>> _resolveBusFileList() async {
    try {
      final raw = await rootBundle.loadString('assets/data/bus-files.json');
      final decoded = jsonDecode(raw) as List<dynamic>;
      return decoded.map((value) => value as String).toList(growable: false);
    } catch (_) {
      final manifestContent = await rootBundle.loadString('AssetManifest.json');
      final manifestMap = jsonDecode(manifestContent) as Map<String, dynamic>;
      final allAssets = manifestMap.keys;
      final dataFiles = allAssets
          .where(
            (asset) =>
                asset.startsWith('assets/data/wonju-bus-') &&
                asset.endsWith('.json'),
          )
          .map((asset) => asset.replaceFirst('assets/data/', ''))
          .toList(growable: false);
      dataFiles.sort();
      return dataFiles;
    }
  }
}
