import {differenceInMinutes, format, isWithinInterval} from 'date-fns';
import {ko} from 'date-fns/locale';
import {BusData, BusOperationInfo, DayType} from '../../../entities/bus/model/types';

const HOLIDAYS_2025 = [
  '2025-01-01',
  '2025-02-01',
  '2025-02-02',
  '2025-02-03',
  '2025-03-01',
  '2025-05-05',
  '2025-06-06',
  '2025-08-15',
  '2025-09-17',
  '2025-09-18',
  '2025-09-19',
  '2025-10-03',
  '2025-10-09',
  '2025-12-25',
];

const VACATION_PERIODS = [
  {start: new Date(2025, 5, 20), end: new Date(2025, 7, 30)},
  {start: new Date(2024, 11, 31), end: new Date(2025, 1, 28)},
  {start: new Date(2025, 11, 31), end: new Date(2026, 1, 28)},
];

export function getTodayDayType(): DayType {
  const today = new Date();

  const formattedDate = format(today, 'yyyy-MM-dd');
  if (HOLIDAYS_2025.includes(formattedDate)) {
    return '공휴일';
  }

  const isVacation = VACATION_PERIODS.some(period =>
    isWithinInterval(today, {start: period.start, end: period.end}),
  );

  if (isVacation) {
    return '방학';
  }

  const dayOfWeek = format(today, 'EEEE', {locale: ko});
  if (dayOfWeek === '토요일') {
    return '토요일';
  }
  if (dayOfWeek === '일요일') {
    return '일요일';
  }

  return '평일';
}

export function filterBusByDayType(
  operations: BusOperationInfo[],
  dayType: DayType,
): BusOperationInfo[] {
  return operations.filter(
    op => op.category === dayType || op.category === '공통',
  );
}

export function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function getRemainingMinutes(departureTime: string): number {
  const now = new Date();
  const departure = parseTimeString(departureTime);

  if (departure < now) {
    return -differenceInMinutes(now, departure);
  }

  return differenceInMinutes(departure, now);
}

export function sortByDepartureTime(
  operations: BusOperationInfo[],
): BusOperationInfo[] {
  return [...operations].sort((a, b) => {
    const timeA = parseTimeString(a.departureTime);
    const timeB = parseTimeString(b.departureTime);
    return timeA.getTime() - timeB.getTime();
  });
}

export function filterRemainingBuses(
  operations: BusOperationInfo[],
): BusOperationInfo[] {
  const now = new Date();
  return operations.filter(op => {
    const departureTime = parseTimeString(op.departureTime);
    return departureTime > now;
  });
}

export function formatRemainingTime(minutes: number): string {
  if (minutes < 0) {
    return `${Math.abs(minutes)}분 전 출발`;
  }
  if (minutes === 0) {
    return '지금 출발';
  }
  if (minutes < 60) {
    return `${minutes}분 후 출발`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}시간 후 출발`;
  }
  return `${hours}시간 ${remainingMinutes}분 후 출발`;
}

export function filterByTerminal(
  busData: BusData,
  terminalName: string,
): BusOperationInfo[] {
  return busData.operationInfo.filter(
    op => op.departureName === terminalName,
  );
}

export function extractTerminals(busData: BusData[]): string[] {
  const terminals = new Set<string>();
  busData.forEach(bus => {
    bus.operationInfo.forEach(op => {
      terminals.add(op.departureName);
      terminals.add(op.arrivalName);
    });
  });
  return Array.from(terminals);
}

export function getTodayKoreanDay(): string {
  return format(new Date(), 'EEEE', {locale: ko});
}

export function countRemainingBuses(operations: BusOperationInfo[]): number {
  return filterRemainingBuses(operations).length;
}
