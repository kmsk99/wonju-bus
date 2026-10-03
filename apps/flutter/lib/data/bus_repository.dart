import 'schedule_source.dart';
import 'holiday_calendar.dart';
import '../models/bus_models.dart';
import '../utils/day_type_utils.dart';
import '../utils/schedule.dart';
export '../utils/schedule.dart' show DepartureRecord;

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

class BusRepository {
  BusRepository._();
  static final instance = BusRepository._();
  List<BusData> _buses = [];
  DateTime? _loadedAt;
  Future<void>? _pending;
  final Map<String, int> _counts = {};

  Future<void> _ensureSchedules() async {
    if (_buses.isNotEmpty &&
        DateTime.now().difference(_loadedAt!).inMinutes < 5) {
      return;
    }
    if (_pending != null) return _pending;
    _pending = () async {
      final snapshot = await ScheduleSource().load();
      _buses = snapshot.entries
          .map(
            (entry) =>
                BusData.fromJson(entry.value as Map<String, dynamic>)
                  ..fileName = entry.key,
          )
          .toList();
      _loadedAt = DateTime.now();
    }();
    try {
      await _pending;
    } finally {
      _pending = null;
    }
  }

  Future<List<BusData>> loadAllBusData() async {
    await Future.wait([HolidayCalendar.instance.load(), _ensureSchedules()]);
    final now = DateTime.now();
    for (final bus in _buses) {
      bus.operatesToday = operatesOn(bus, now);
    }
    return _buses;
  }

  Future<BusData?> loadBusData(String routeNumber) async {
    final buses = await loadAllBusData();
    for (final bus in buses) {
      if (bus.routeInfo.routeNumber == routeNumber) return bus;
    }
    final variants = buses
        .where(
          (bus) => parseBusFileName(bus.fileName!).routeNumber == routeNumber,
        )
        .toList();
    if (variants.isEmpty) return null;
    return variants.firstWhere(
      (bus) => bus.operatesToday == true,
      orElse: () => variants.first,
    );
  }

  Future<bool> isRouteOperatingToday(String route) async =>
      (await loadBusData(route))?.operatesToday ?? false;
  Future<List<String>> loadTerminals() async {
    final buses = await loadAllBusData();
    final routes = <String, Set<String>>{};
    for (final bus in buses) {
      for (final op in bus.operationInfo) {
        for (final name in [op.departureName, op.arrivalName]) {
          if (name.trim().isEmpty || name == '-') continue;
          routes
              .putIfAbsent(name, () => {})
              .add(parseBusFileName(bus.fileName!).routeNumber);
        }
      }
    }
    _counts.clear();
    routes.forEach((name, set) => _counts[name] = set.length);
    return routes.keys.toList()
      ..sort((a, b) => _counts[b]!.compareTo(_counts[a]!));
  }

  int getRouteCountForTerminal(String name) => _counts[name] ?? 0;
  Future<List<String>> loadRoutesByTerminal(String name) async =>
      (await loadAllBusData())
          .where(
            (bus) => bus.operationInfo.any((op) => op.departureName == name),
          )
          .map((bus) => bus.routeInfo.routeNumber)
          .toList();
  Future<List<String>> loadRoutesToTerminal(String name) async =>
      (await loadAllBusData())
          .where((bus) => bus.operationInfo.any((op) => op.arrivalName == name))
          .map((bus) => bus.routeInfo.routeNumber)
          .toList();
  Future<List<DepartureRecord>> getAllDepartureTimesFromStop(
    String name,
  ) async => departuresFromStop(await loadAllBusData(), name, DateTime.now());
  Future<Map<String, GroupedDeparture>> groupDeparturesByRoute(
    String name, {
    bool? isFromTerminal,
  }) async {
    final departures = (await getAllDepartureTimesFromStop(name))
        .where(
          (d) => isFromTerminal == null || d.isFromTerminal == isFromTerminal,
        )
        .toList();
    final grouped = <String, GroupedDeparture>{};
    for (final route in departures.map((d) => d.routeNumber).toSet()) {
      final items = departures.where((d) => d.routeNumber == route).toList();
      grouped[route] = GroupedDeparture(
        nextDeparture: items.first,
        remainingCount: items.where((d) => !d.isNextDay).length,
        operatesToday: await isRouteOperatingToday(route),
      );
    }
    return grouped;
  }
}
