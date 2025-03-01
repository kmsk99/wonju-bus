import { differenceInMinutes, format, isWithinInterval, setHours } from "date-fns";
import { ko } from "date-fns/locale";

import { BusData, BusOperationInfo, DayType } from "@/entities/bus/model/types";

// 한국 공휴일 목록 (2025년 기준)
const HOLIDAYS_2025 = [
  "2025-01-01", // 신정
  "2025-02-01", // 설날 (추정)
  "2025-02-02", // 설날 (추정)
  "2025-02-03", // 설날 (추정)
  "2025-03-01", // 삼일절
  "2025-05-05", // 어린이날
  "2025-06-06", // 현충일
  "2025-08-15", // 광복절
  "2025-09-17", // 추석 (추정)
  "2025-09-18", // 추석 (추정)
  "2025-09-19", // 추석 (추정)
  "2025-10-03", // 개천절
  "2025-10-09", // 한글날
  "2025-12-25", // 크리스마스
];

// 방학 기간 설정 - 요청대로 여름방학(6/20-8/30)과 겨울방학(12/31-2/28) 설정
const VACATION_PERIODS = [
  {
    start: new Date(2025, 5, 20), // 6월 20일 (월은 0부터 시작)
    end: new Date(2025, 7, 30), // 8월 30일
  },
  {
    start: new Date(2024, 11, 31), // 12월 31일
    end: new Date(2025, 1, 28), // 2월 28일
  },
  {
    start: new Date(2025, 11, 31), // 다음 해 12월 31일 (겨울방학 시작)
    end: new Date(2026, 1, 28), // 다음 해 2월 28일
  },
];

/**
 * 오늘의 요일 타입을 반환합니다.
 */
export function getTodayDayType(): DayType {
  const today = new Date();

  // 1. 공휴일 체크
  const formattedDate = format(today, "yyyy-MM-dd");
  if (HOLIDAYS_2025.includes(formattedDate)) {
    return "공휴일";
  }

  // 2. 방학 기간 체크
  const isVacation = VACATION_PERIODS.some((period) =>
    isWithinInterval(today, { start: period.start, end: period.end })
  );

  if (isVacation) {
    return "방학";
  }

  // 3. 주말 체크
  const dayOfWeek = format(today, "EEEE", { locale: ko });
  if (dayOfWeek === "토요일") return "토요일";
  if (dayOfWeek === "일요일") return "일요일";

  // 4. 평일
  return "평일";
}

/**
 * 특정 요일 타입에 맞는 버스 운행 정보를 필터링합니다.
 */
export function filterBusByDayType(
  operations: BusOperationInfo[],
  dayType: DayType
): BusOperationInfo[] {
  return operations.filter(
    (op) => op.category === dayType || op.category === "공통"
  );
}

/**
 * 문자열 시간을 Date 객체로 변환합니다.
 */
export function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * 현재 시간으로부터 다음 버스 출발까지 남은 시간(분)을 계산합니다.
 */
export function getRemainingMinutes(departureTime: string): number {
  const now = new Date();
  const departure = parseTimeString(departureTime);

  // 출발 시간이 현재 시간보다 이전이면 음수 반환 (이미 출발함)
  if (departure < now) {
    return -differenceInMinutes(now, departure);
  }

  return differenceInMinutes(departure, now);
}

/**
 * 출발 시간 기준으로 버스 운행 정보를 정렬합니다.
 */
export function sortByDepartureTime(
  operations: BusOperationInfo[]
): BusOperationInfo[] {
  return [...operations].sort((a, b) => {
    const timeA = parseTimeString(a.departureTime);
    const timeB = parseTimeString(b.departureTime);
    return timeA.getTime() - timeB.getTime();
  });
}

/**
 * 현재 시간 이후의 버스 운행 정보만 필터링합니다.
 */
export function filterRemainingBuses(
  operations: BusOperationInfo[]
): BusOperationInfo[] {
  const now = new Date();
  return operations.filter((op) => {
    const departureTime = parseTimeString(op.departureTime);
    return departureTime > now;
  });
}

/**
 * 남은 시간을 사람이 읽기 쉬운 형식으로 반환합니다.
 */
export function formatRemainingTime(minutes: number): string {
  if (minutes < 0) {
    return `${Math.abs(minutes)}분 전 출발`;
  }

  if (minutes === 0) {
    return "지금 출발";
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

/**
 * 특정 종점에서 출발하는 버스 운행 정보를 필터링합니다.
 */
export function filterByTerminal(
  busData: BusData,
  terminalName: string
): BusOperationInfo[] {
  return busData.operationInfo.filter(
    (op) => op.departureName === terminalName
  );
}

/**
 * 버스 데이터에서 모든 종점 이름을 추출합니다. (중복 제거)
 */
export function extractTerminals(busData: BusData[]): string[] {
  const terminals = new Set<string>();

  busData.forEach((bus) => {
    bus.operationInfo.forEach((op) => {
      terminals.add(op.departureName);
      terminals.add(op.arrivalName);
    });
  });

  return Array.from(terminals);
}

/**
 * 현재 날짜의 요일을 한글로 반환합니다.
 */
export function getTodayKoreanDay(): string {
  return format(new Date(), "EEEE", { locale: ko });
}

/**
 * 오늘 남은 버스 수를 계산합니다.
 */
export function countRemainingBuses(operations: BusOperationInfo[]): number {
  return filterRemainingBuses(operations).length;
}
