import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wonju_bus_flutter/data/holiday_calendar.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));
  test(
    'public calendar persists a new temporary holiday and deduplicates requests',
    () async {
      final raw = await rootBundle.loadString('assets/data/holidays.json');
      final bundled = jsonDecode(raw) as Map<String, dynamic>;
      var requests = 0;
      final calendar = HolidayCalendar(
        loadBundled: () async => raw,
        createClient: () => MockClient((request) async {
          requests++;
          final year = request.url.queryParameters['year']!;
          return http.Response(
            jsonEncode({
              'holidays': {
                ...bundled[year] as Map<String, dynamic>,
                if (year == '2026') '2026-10-06': ['test temporary holiday'],
              },
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }),
      );
      final now = DateTime.parse('2026-10-06T00:00:00+09:00');
      await Future.wait([calendar.load(now), calendar.load(now)]);
      expect(requests, 2);
      expect(calendar.names(now), ['test temporary holiday']);
      final offline = HolidayCalendar(
        loadBundled: () async => raw,
        createClient: () => MockClient(
          (request) async => http.Response(
            jsonEncode({
              'fallback': true,
              'holidays': bundled[request.url.queryParameters['year']],
            }),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          ),
        ),
      );
      await offline.load(now);
      expect(offline.names(now), ['test temporary holiday']);
    },
  );
  test(
    'broken cache and network use the bundle; unknown years stay unknown',
    () async {
      SharedPreferences.setMockInitialValues({'holidays:2026': 'broken'});
      final raw = await rootBundle.loadString('assets/data/holidays.json');
      final calendar = HolidayCalendar(
        loadBundled: () async => raw,
        createClient: () => MockClient((_) async => throw Exception('offline')),
      );
      final now = DateTime.parse('2026-10-05T00:00:00+09:00');
      await calendar.load(now);
      expect(calendar.names(now), ['대체공휴일(개천절)']);
      expect(calendar.known(DateTime.utc(2099)), false);
    },
  );
}
