import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wonju_bus_flutter/data/holiday_calendar.dart';
import 'package:wonju_bus_flutter/models/bus_models.dart';
import 'package:wonju_bus_flutter/utils/day_type_utils.dart';
import 'package:wonju_bus_flutter/utils/schedule.dart';

DateTime date(String day) => DateTime.parse('${day}T00:00:00+09:00');
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late List<BusData> buses;
  BusData bus(String route) =>
      buses.firstWhere((b) => b.routeInfo.routeNumber == route);
  BusData fixture(String route, String time, [String reverse = '-']) =>
      BusData.fromJson({
        'routeInfo': {
          'routeNumber': route,
          'origin': 'A',
          'destination': 'B',
          'firstBusTime': time,
          'lastBusTime': time,
          'operationCount': '1',
          'interval': '-',
        },
        'operationInfo': [
          {
            'operationNumber': '1',
            'departureTime': time,
            'arrivalTime': reverse,
            'departureName': 'A',
            'arrivalName': 'B',
            'category': '공통',
            'note': '',
          },
        ],
      })..fileName = 'wonju-bus-$route.json';
  setUpAll(() async {
    final calendars =
        jsonDecode(await rootBundle.loadString('assets/data/holidays.json'))
            as Map<String, dynamic>;
    for (final entry in calendars.entries) {
      HolidayCalendar.instance.years[entry.key] = HolidayCalendar.decode(
        entry.value,
        int.parse(entry.key),
      );
    }
    final snapshot =
        jsonDecode(await rootBundle.loadString('assets/data/snapshot.json'))
            as Map<String, dynamic>;
    buses = snapshot.entries
        .map(
          (e) =>
              BusData.fromJson(e.value as Map<String, dynamic>)
                ..fileName = e.key,
        )
        .toList();
  });
  test(
    'holiday replaces weekdays, including temporary and substitute days',
    () {
      for (final day in [
        '2025-01-27',
        '2025-06-03',
        '2026-03-02',
        '2026-05-01',
        '2026-06-03',
        '2026-07-17',
        '2026-10-03',
        '2026-10-05',
        '2027-12-27',
      ]) {
        expect(getCurrentDayTypes(now: date(day)), [
          '공휴일',
          '휴일',
          '공통',
        ], reason: day);
        expect(isDayTypeMatch('평일, 토요일', now: date(day)), false);
      }
      expect(koreaDate(DateTime.parse('2026-10-04T15:00:00Z')), '2026-10-05');
      expect(isDayTypeMatch('평일, 토요일', now: date('2026-10-10')), true);
      expect(isDayTypeMatch('토, 일', now: date('2026-10-04')), true);
      expect(getCurrentDayTypes(now: date('2099-01-03')), ['공통']);
      expect(
        getCurrentDayTypes(
          isVacation: true,
          isHoliday: false,
          now: date('2026-10-06'),
        ),
        ['방학', '공통'],
      );
    },
  );
  test('reject malformed times and incomplete calendars', () {
    for (final time in ['-', '순환', '통학12', '24:00', '09:60', 'abc', '']) {
      expect(timeMinutes(time), null);
    }
    expect(timeMinutes('8:05'), 485);
    expect(() => HolidayCalendar.decode({}, 2026), throwsFormatException);
    expect(
      () => HolidayCalendar.decode({
        ...HolidayCalendar.instance.years['2026']!,
        '2026-02-30': ['bad'],
      }, 2026),
      throwsFormatException,
    );
  });
  test(
    'apply cancellation notes without cancelling location-specific notes',
    () {
      expect(operatesOn(bus('59'), date('2026-10-05')), false);
      expect(operatesOn(bus('81'), date('2026-10-04')), false);
      expect(operatesOn(bus('조조'), date('2026-10-04')), false);
      final route = bus('41(주말,공휴일)');
      final op = route.operationInfo.firstWhere(
        (o) => o.operationNumber == '3',
      );
      expect(operationApplies(route, op, date('2026-10-04')), false);
      expect(operationApplies(route, op, date('2026-10-10')), true);
      expect(operatesOn(bus('8(주말,공휴일)'), date('2026-10-04')), true);
    },
  );
  test(
    'tomorrow uses its own timetable at weekends, holidays and year boundary',
    () {
      final service = [
        fixture('2(평일)', '08:00'),
        fixture('2(토요일)', '09:00'),
        fixture('2(일,공휴일)', '10:00'),
      ];
      for (final day in ['2026-10-02', '2026-10-04', '2026-12-31']) {
        final results = departuresFromStop(
          service,
          'A',
          DateTime.parse('${day}T22:00:00+09:00'),
        );
        expect(results.length, 1);
        expect(results.first.routeNumber, '2(일,공휴일)');
        expect(results.first.isNextDay, true);
        expect(results.first.nextDepartureMinutes, 720);
      }
      expect(
        departuresFromStop(
          service,
          'A',
          DateTime.parse('2026-10-05T22:00:00+09:00'),
        ).first.routeNumber,
        '2(평일)',
      );
    },
  );
  test('second boundaries, reverse terminus and non-time labels', () {
    final service = [fixture('10', '08:00', '12:00')];
    expect(
      departuresFromStop(
        service,
        'A',
        DateTime.parse('2026-10-06T08:00:01+09:00'),
      ).every((d) => d.isNextDay),
      true,
    );
    expect(
      departuresFromStop(
        service,
        'A',
        DateTime.parse('2026-10-06T07:59:59+09:00'),
      ).first.nextDepartureMinutes,
      1,
    );
    expect(
      departuresFromStop(service, 'B', date('2026-10-06')).first.departureTime,
      '12:00',
    );
    expect(
      departuresFromStop([fixture('10', '순환')], 'A', date('2026-10-06')),
      isEmpty,
    );
  });
}
