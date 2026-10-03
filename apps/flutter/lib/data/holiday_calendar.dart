import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

DateTime koreaTime([DateTime? now]) =>
    (now ?? DateTime.now()).toUtc().add(const Duration(hours: 9));
String koreaDate([DateTime? now]) =>
    koreaTime(now).toIso8601String().substring(0, 10);
DateTime koreaDayStart([DateTime? now]) =>
    DateTime.parse('${koreaDate(now)}T00:00:00+09:00');

class HolidayCalendar {
  HolidayCalendar({
    http.Client Function()? createClient,
    Future<String> Function()? loadBundled,
  }) : _createClient = createClient ?? http.Client.new,
       _loadBundled =
           loadBundled ??
           (() => rootBundle.loadString('assets/data/holidays.json'));
  final http.Client Function() _createClient;
  final Future<String> Function() _loadBundled;
  static final instance = HolidayCalendar();
  final Map<String, Map<String, dynamic>> years = {};
  final Map<int, DateTime> _refreshed = {};
  Future<void>? _pending;
  bool _bundled = false;

  bool known([DateTime? now]) =>
      years.containsKey(koreaDate(now).substring(0, 4));
  List<String> names([DateTime? now]) {
    final date = koreaDate(now);
    return List<String>.from(years[date.substring(0, 4)]?[date] ?? []);
  }

  static Map<String, dynamic> decode(Object? value, int year) {
    if (value is! Map<String, dynamic> ||
        value.length < 10 ||
        value.length > 100 ||
        !value.containsKey('$year-01-01') ||
        !value.containsKey('$year-12-25')) {
      throw const FormatException('Incomplete holiday year');
    }
    for (final entry in value.entries) {
      final date = DateTime.tryParse(entry.key);
      if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(entry.key) ||
          date == null ||
          date.year != year ||
          date.toIso8601String().substring(0, 10) != entry.key ||
          entry.value is! List ||
          (entry.value as List).isEmpty ||
          (entry.value as List).any(
            (name) => name is! String || name.trim().isEmpty,
          )) {
        throw const FormatException('Invalid holiday');
      }
    }
    return value;
  }

  Future<void> load([DateTime? now]) async {
    if (_pending != null) return _pending;
    _pending = _load(now);
    try {
      await _pending;
    } finally {
      _pending = null;
    }
  }

  Future<void> _load(DateTime? now) async {
    if (!_bundled) {
      final bundled = jsonDecode(await _loadBundled()) as Map<String, dynamic>;
      for (final entry in bundled.entries) {
        years[entry.key] = decode(entry.value, int.parse(entry.key));
      }
      _bundled = true;
    }
    final currentYear = koreaTime(now).year;
    await Future.wait(
      [currentYear, currentYear + 1].map((year) async {
        if (DateTime.now()
                .difference(_refreshed[year] ?? DateTime(2000))
                .inMinutes <
            360) {
          return;
        }
        SharedPreferences? prefs;
        var hasCached = false;
        try {
          prefs = await SharedPreferences.getInstance();
          final cached = prefs.getString('holidays:$year');
          if (cached != null) {
            years['$year'] = decode(jsonDecode(cached), year);
            hasCached = true;
          }
        } catch (_) {
          /* Retain bundle on cache corruption. */
        }
        final client = _createClient();
        try {
          final response = await client
              .get(
                Uri.parse(
                  'https://wonju-bus-mason.vercel.app/api/holidays?year=$year',
                ),
              )
              .timeout(const Duration(seconds: 8));
          if (response.statusCode != 200) {
            throw const FormatException('Holiday API unavailable');
          }
          final payload = jsonDecode(utf8.decode(response.bodyBytes));
          final dates = decode(payload['holidays'], year);
          if (payload['fallback'] == true && hasCached) {
            _refreshed[year] = DateTime.now().subtract(
              const Duration(minutes: 355),
            );
            return; // Do not replace newer cached dates with the server bundle.
          }
          years['$year'] = dates;
          _refreshed[year] = DateTime.now();
          try {
            await prefs?.setString('holidays:$year', jsonEncode(dates));
          } catch (_) {
            /* Use memory. */
          }
        } catch (_) {
          _refreshed[year] = DateTime.now().subtract(
            const Duration(minutes: 355),
          );
        } finally {
          client.close();
        }
      }),
    );
  }
}
