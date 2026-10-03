import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:wonju_bus_flutter/data/schedule_source.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test('packaged fallback contains valid bus schedules', () async {
    final raw = await rootBundle.loadString('assets/data/snapshot.json');
    expect(ScheduleSource.decode(raw).length, greaterThan(0));
  });
}
