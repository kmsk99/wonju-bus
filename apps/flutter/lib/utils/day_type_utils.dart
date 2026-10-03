import '../models/bus_models.dart';

typedef DayType = String;

/// Patterns that appear in data file names mapped to the concrete day types.
const Map<String, List<DayType>> _dayTypePatterns = {
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
  bool isHoliday = false,
}) {
  if (dayTypeGroup == null) {
    return true;
  }

  final groupDayTypes = getDayTypesFromGroup(dayTypeGroup);
  final currentDayTypes = getCurrentDayTypes(
    isVacation: isVacation,
    isHoliday: isHoliday,
  );

  return currentDayTypes.any(groupDayTypes.contains);
}

/// Returns the applicable day types for today taking vacation/holiday mode into account.
List<DayType> getCurrentDayTypes({
  bool isVacation = false,
  bool isHoliday = false,
}) {
  final now = DateTime.now();
  final dayOfWeek = now.weekday; // 1 = Monday, 7 = Sunday

  final dayTypes = <DayType>{};

  switch (dayOfWeek) {
    case DateTime.saturday:
      dayTypes.add('토요일');
      dayTypes.add('휴일');
      break;
    case DateTime.sunday:
      dayTypes.add('일요일');
      dayTypes.add('휴일');
      break;
    default:
      dayTypes.add('평일');
      break;
  }

  if (isHoliday) {
    dayTypes.addAll({'공휴일', '휴일'});
  }

  if (isVacation) {
    dayTypes.add('방학');
  }

  dayTypes.add('공통');

  return dayTypes.toList();
}

/// Parses human-readable day type text for display.
String generateDayTypeText({bool isVacation = false, bool isHoliday = false}) {
  final now = DateTime.now();
  final dayOfWeek = now.weekday;

  if (dayOfWeek == DateTime.saturday) {
    return '토요일';
  }
  if (dayOfWeek == DateTime.sunday) {
    return '일요일';
  }
  return '평일';
}

/// Converts a stored day-type group string to the underlying types.
List<DayType> getDayTypesFromGroup(String dayTypeGroup) {
  final normalized = dayTypeGroup.trim();

  final directMatch = _dayTypePatterns[normalized];
  if (directMatch != null) {
    return directMatch;
  }

  return normalized
      .split(',')
      .map((type) => type.trim())
      .where((type) => type.isNotEmpty)
      .toList();
}
