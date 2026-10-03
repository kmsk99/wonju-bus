import '../data/holiday_calendar.dart';
import '../models/bus_models.dart';
import 'day_type_utils.dart';

int? timeMinutes(String time) {
  final match = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(time.trim());
  if (match == null) return null;
  final hour = int.parse(match.group(1)!), minute = int.parse(match.group(2)!);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}

bool operationApplies(BusData bus, BusOperationInfo op, DateTime now) {
  final group = parseBusFileName(
    bus.fileName ?? 'wonju-bus-${bus.routeInfo.routeNumber}.json',
  ).dayTypeGroup;
  final excluded = RegExp(
    r'((?:(?:토요일|일요일|공휴일|평일|주말|휴일|방학|토|일)[\s,ㆍ]*)+)(?:미운행|운행안함)',
  ).firstMatch(op.note)?.group(1);
  if (excluded != null &&
      isDayTypeMatch(
        excluded.replaceAll('ㆍ', ',').replaceAll(RegExp(r'[\s,]+$'), ''),
        now: now,
      )) {
    return false;
  }
  if (RegExp(r'평일만\s*운행').hasMatch(op.note) &&
      !isDayTypeMatch('평일', now: now)) {
    return false;
  }
  return isDayTypeMatch(group, now: now) &&
      isDayTypeMatch(op.category, now: now);
}

bool operatesOn(BusData bus, DateTime now) => bus.operationInfo.any(
  (op) =>
      operationApplies(bus, op, now) &&
      (timeMinutes(op.departureTime) != null ||
          timeMinutes(op.arrivalTime) != null),
);

class DepartureRecord {
  DepartureRecord({
    required this.routeNumber,
    required this.departureTime,
    required this.nextDepartureMinutes,
    required this.category,
    required this.isFromTerminal,
    this.isNextDay = false,
    this.note = '',
    this.tripIndex,
  });
  final String routeNumber, departureTime, category;
  final String note;
  final int nextDepartureMinutes;
  final bool isFromTerminal, isNextDay;
  final int? tripIndex;
}

List<DepartureRecord> departuresFromStop(
  List<BusData> buses,
  String stop,
  DateTime now,
) {
  final result = <DepartureRecord>[];
  final seen = <String>{};
  for (final bus in buses) {
    for (var offset = 0; offset <= 1; offset++) {
      final start = koreaDayStart(now).add(Duration(days: offset));
      for (var index = 0; index < bus.operationInfo.length; index++) {
        final op = bus.operationInfo[index];
        if (!operationApplies(bus, op, start)) continue;
        for (final entry in [
          (op.departureName, op.departureTime, true),
          (op.arrivalName, op.arrivalTime, false),
        ]) {
          final minutes = timeMinutes(entry.$2);
          if (entry.$1 != stop || minutes == null) continue;
          final at = start.add(Duration(minutes: minutes));
          if (at.isBefore(now)) continue;
          final key =
              '${bus.routeInfo.routeNumber}|$at|${entry.$3}|${op.operationNumber}';
          if (!seen.add(key)) continue;
          result.add(
            DepartureRecord(
              routeNumber: bus.routeInfo.routeNumber,
              departureTime: entry.$2,
              nextDepartureMinutes: (at.difference(now).inMilliseconds / 60000)
                  .ceil(),
              category: op.category,
              note: op.note,
              isFromTerminal: entry.$3,
              isNextDay: offset == 1,
              tripIndex: int.tryParse(op.operationNumber) ?? index + 1,
            ),
          );
        }
      }
    }
  }
  return result
    ..sort((a, b) => a.nextDepartureMinutes.compareTo(b.nextDepartureMinutes));
}
