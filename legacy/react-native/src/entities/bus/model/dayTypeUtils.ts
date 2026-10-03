import {BusFileInfo, DayType, DayTypeGroup, DayTypePattern} from './types';

const DAY_TYPE_PATTERNS: DayTypePattern[] = [
  {pattern: '평일', dayTypes: ['평일']},
  {pattern: '토요일', dayTypes: ['토요일']},
  {pattern: '일요일', dayTypes: ['일요일']},
  {pattern: '공휴일', dayTypes: ['공휴일']},
  {pattern: '방학', dayTypes: ['방학']},
  {pattern: '휴일', dayTypes: ['휴일']},
  {pattern: '주말', dayTypes: ['토요일', '일요일']},
  {pattern: '주말,공휴일', dayTypes: ['토요일', '일요일', '공휴일']},
  {pattern: '일,공휴일', dayTypes: ['일요일', '공휴일']},
  {pattern: '평일,토요일', dayTypes: ['평일', '토요일']},
  {pattern: '평일, 토요일', dayTypes: ['평일', '토요일']},
  {pattern: '방학,휴일', dayTypes: ['방학', '휴일']},
];

export function parseBusFileName(fileName: string): BusFileInfo {
  const nameWithoutPrefix = fileName.replace(/^wonju-bus-/, '');
  const nameWithoutExtension = nameWithoutPrefix.replace(/\.json$/, '');

  let routeNumber: string;
  let dayTypeGroup: DayTypeGroup | null = null;

  const matches = nameWithoutExtension.match(/^(.*?)(?:\((.*?)\))?$/);

  if (matches && matches.length >= 2) {
    routeNumber = matches[1];
    if (matches[2]) {
      dayTypeGroup = matches[2];
    }
  } else {
    routeNumber = nameWithoutExtension;
  }

  return {routeNumber, dayTypeGroup, fileName};
}

export function isDayTypeMatch(
  dayTypeGroup: DayTypeGroup | null,
  isVacation: boolean = false,
  isHoliday: boolean = false,
): boolean {
  if (!dayTypeGroup) {
    return true;
  }

  const currentDayTypes: DayType[] = getCurrentDayTypes(isVacation, isHoliday);
  const groupDayTypes: DayType[] = getDayTypesFromGroup(dayTypeGroup);

  return currentDayTypes.some(dayType => groupDayTypes.includes(dayType));
}

export function getCurrentDayTypes(
  isVacation: boolean = false,
  isHoliday: boolean = false,
): DayType[] {
  const now = new Date();
  const dayOfWeek = now.getDay();

  const dayTypes: DayType[] = [];

  if (dayOfWeek === 0) {
    dayTypes.push('일요일');
  } else if (dayOfWeek === 6) {
    dayTypes.push('토요일');
  } else {
    dayTypes.push('평일');
  }

  if (isHoliday) {
    dayTypes.push('공휴일');
    dayTypes.push('휴일');
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    dayTypes.push('휴일');
  }

  if (isVacation) {
    dayTypes.push('방학');
  }

  dayTypes.push('공통');

  return dayTypes;
}

export function getDayTypesFromGroup(dayTypeGroup: DayTypeGroup): DayType[] {
  for (const pattern of DAY_TYPE_PATTERNS) {
    if (pattern.pattern === dayTypeGroup) {
      return pattern.pattern === '공통' ? ['공통'] : pattern.dayTypes;
    }
  }

  return dayTypeGroup.split(',').map(type => type.trim() as DayType);
}
