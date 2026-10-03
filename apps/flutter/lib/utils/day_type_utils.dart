import '../data/holiday_calendar.dart';
import '../models/bus_models.dart';

typedef DayType = String;

/// Patterns that appear in data file names mapped to the concrete day types.
const Map<String, List<DayType>> _dayTypePatterns = {
  '토': ['토요일'],
  '일': ['일요일'],
  '평일': ['평일'],
  '토요일': ['토요일'],
  '일요일': ['일요일'],
  '공휴일': ['공휴일'],
  '방학': ['방학'],
  '휴일': ['휴일'],
  '주말': ['토요일', '일요일'],
  '주말,공휴일': ['토요일', '일요일', '공휴일'],
  '일,공휴일': ['일요일', '공휴일'],
  '평일,토요일': ['평일', '토요일'],
  '방학,휴일': ['방학', '휴일'],
  '공통': ['공통'],
};

/// Extracts metadata from a raw bus data file name.
BusFileInfo parseBusFileName(String fileName) {
  final withoutPrefix = fileName.replaceFirst(RegExp(r'^wonju-bus-'), '');
  final withoutExtension = withoutPrefix.replaceFirst('.json', '');

  final match = RegExp(
    r'^(.*?)(?:\((.*?)\))?$',
  ).firstMatch(withoutExtension.trim());

  final routeNumber = match?.group(1)?.trim() ?? withoutExtension.trim();
  final dayTypeGroup = match?.group(2)?.trim();

  return BusFileInfo(
    routeNumber: routeNumber,
    dayTypeGroup: dayTypeGroup?.isEmpty ?? true ? null : dayTypeGroup,
    fileName: fileName,
  );
}

/// Determines whether the provided [dayTypeGroup] applies to the current date.
bool isDayTypeMatch(
  String? dayTypeGroup, {
  bool isVacation = false,
  bool? isHoliday,
  DateTime? now,
}) {
  if (dayTypeGroup == null) {
    return true;
  }

  final groupDayTypes = getDayTypesFromGroup(dayTypeGroup);
  final currentDayTypes = getCurrentDayTypes(
    isVacation: isVacation,
    isHoliday: isHoliday,
    now: now,
  );

  return currentDayTypes.any(groupDayTypes.contains);
}

/// Returns the applicable day types for today taking vacation/holiday mode into account.
List<DayType> getCurrentDayTypes({
  bool isVacation = false,
  bool? isHoliday,
  DateTime? now,
}) {
  final day = koreaTime(now).weekday;
  final holiday = isHoliday ?? HolidayCalendar.instance.names(now).isNotEmpty;
  if (isHoliday == null && !HolidayCalendar.instance.known(now)) return ['공통'];
  final types = holiday
      ? <String>['공휴일', '휴일']
      : day == DateTime.sunday
      ? <String>['일요일', '휴일']
      : day == DateTime.saturday
      ? <String>['토요일', '휴일']
      : <String>['평일'];
  if (isVacation) {
    types.remove('평일');
    types.add('방학');
  }
  return [...types, '공통'];
}

String generateDayTypeText({
  bool isVacation = false,
  bool? isHoliday,
  DateTime? now,
}) {
  if (isHoliday == null && !HolidayCalendar.instance.known(now)) {
    return '공휴일 정보 확인 필요';
  }
  final names = HolidayCalendar.instance.names(now);
  return names.isNotEmpty
      ? names.join(', ')
      : getCurrentDayTypes(
          isVacation: isVacation,
          isHoliday: isHoliday,
          now: now,
        ).first;
}

/// Converts a stored day-type group string to the underlying types.
List<DayType> getDayTypesFromGroup(String dayTypeGroup) {
  final normalized = dayTypeGroup.replaceAll(RegExp(r'\s'), '');

  final directMatch = _dayTypePatterns[normalized];
  if (directMatch != null) {
    return directMatch;
  }

  return normalized
      .split(',')
      .expand((type) => _dayTypePatterns[type.trim()] ?? [type.trim()])
      .where((type) => type.isNotEmpty)
      .toList();
}
