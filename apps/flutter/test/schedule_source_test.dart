import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wonju_bus_flutter/data/schedule_source.dart';

String snapshot(String number) => jsonEncode({
  'wonju-bus-$number.json': {
    'routeInfo': {'routeNumber': number},
    'operationInfo': [
      {'departureTime': '09:00'},
    ],
  },
});
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));
  test('online snapshot is cached and used offline', () async {
    final online = ScheduleSource(
      client: MockClient((request) async {
        expect(request.url.path, '/data/snapshot.json');
        return http.Response(snapshot('2'), 200);
      }),
      loadBundled: () async => snapshot('1'),
    );
    expect((await online.load()).keys, ['wonju-bus-2.json']);
    final offline = ScheduleSource(
      client: MockClient((_) async => throw Exception('offline')),
      loadBundled: () async => snapshot('1'),
    );
    expect((await offline.load()).keys, ['wonju-bus-2.json']);
  });
  test('invalid response preserves last good cache', () async {
    final prefs = await SharedPreferences.getInstance();
    const key = 'bus_snapshot_v1:https://wonju-bus-mason.vercel.app/data';
    await prefs.setString(key, snapshot('2'));
    final source = ScheduleSource(
      client: MockClient((_) async => http.Response('{}', 200)),
      loadBundled: () async => snapshot('1'),
    );
    expect((await source.load()).keys, ['wonju-bus-2.json']);
    expect(prefs.getString(key), snapshot('2'));
  });
  test('corrupt cache falls back to bundled schedules', () async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      'bus_snapshot_v1:https://wonju-bus-mason.vercel.app/data',
      '{bad',
    );
    final source = ScheduleSource(
      client: MockClient((_) async => http.Response('down', 503)),
      loadBundled: () async => snapshot('1'),
    );
    expect((await source.load()).keys, ['wonju-bus-1.json']);
  });
  test('rejects empty or malformed schedules', () {
    expect(() => ScheduleSource.decode('{}'), throwsFormatException);
    expect(
      () => ScheduleSource.decode(
        '{"wonju-bus-1.json":{"routeInfo":{"routeNumber":"1"},"operationInfo":[7]}}',
      ),
      throwsFormatException,
    );
  });
}
