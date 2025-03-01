import { BusFileInfo, DayType, DayTypeGroup, DayTypePattern } from "./types";

// 데이 타입 패턴 정의
const DAY_TYPE_PATTERNS: DayTypePattern[] = [
  { pattern: "평일", dayTypes: ["평일"] },
  { pattern: "토요일", dayTypes: ["토요일"] },
  { pattern: "일요일", dayTypes: ["일요일"] },
  { pattern: "공휴일", dayTypes: ["공휴일"] },
  { pattern: "방학", dayTypes: ["방학"] },
  { pattern: "휴일", dayTypes: ["휴일"] },
  { pattern: "주말", dayTypes: ["토요일", "일요일"] },
  { pattern: "주말,공휴일", dayTypes: ["토요일", "일요일", "공휴일"] },
  { pattern: "일,공휴일", dayTypes: ["일요일", "공휴일"] },
  { pattern: "평일,토요일", dayTypes: ["평일", "토요일"] },
  { pattern: "방학,휴일", dayTypes: ["방학", "휴일"] },
];

/**
 * 버스 파일 이름에서 노선 번호와 요일 타입을 추출합니다.
 * @param fileName 파일 이름 (예: "wonju-bus-2(평일).json")
 * @returns 추출된 버스 파일 정보
 */
export function parseBusFileName(fileName: string): BusFileInfo {
  // wonju-bus- 제거
  const nameWithoutPrefix = fileName.replace(/^wonju-bus-/, "");
  // .json 제거
  const nameWithoutExtension = nameWithoutPrefix.replace(/\.json$/, "");

  let routeNumber: string;
  let dayTypeGroup: DayTypeGroup | null = null;

  // 괄호 안의 요일 타입 추출
  const matches = nameWithoutExtension.match(/^(.*?)(?:\((.*?)\))?$/);

  if (matches && matches.length >= 2) {
    routeNumber = matches[1];
    if (matches[2]) {
      dayTypeGroup = matches[2];
    }
  } else {
    routeNumber = nameWithoutExtension;
  }

  return {
    routeNumber,
    dayTypeGroup,
    fileName,
  };
}

/**
 * 현재 날짜가 해당 요일 타입 그룹에 속하는지 확인합니다.
 * @param dayTypeGroup 요일 타입 그룹 (예: "평일", "주말,공휴일")
 * @param isVacation 방학 여부
 * @param isHoliday 공휴일 여부
 * @returns 현재 날짜가 해당 요일 타입 그룹에 속하는지 여부
 */
export function isDayTypeMatch(
  dayTypeGroup: DayTypeGroup | null,
  isVacation: boolean = false,
  isHoliday: boolean = false
): boolean {
  if (!dayTypeGroup) return true; // 요일 타입이 지정되지 않은 경우 모든 날짜에 적용

  // 현재 날짜의 요일 타입 목록
  const currentDayTypes: DayType[] = getCurrentDayTypes(isVacation, isHoliday);

  // 요일 타입 그룹에 해당하는 모든
  const groupDayTypes: DayType[] = getDayTypesFromGroup(dayTypeGroup);

  // 현재 날짜의 요일 타입 중 하나라도 그룹에 포함되면 일치
  return currentDayTypes.some((dayType) => groupDayTypes.includes(dayType));
}

/**
 * 현재 날짜에 해당하는 모든 요일 타입을 반환합니다.
 * @param isVacation 방학 여부
 * @param isHoliday 공휴일 여부
 * @returns 현재 날짜에 해당하는 요일 타입 목록
 */
export function getCurrentDayTypes(
  isVacation: boolean = false,
  isHoliday: boolean = false
): DayType[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: 일요일, 1-5: 평일, 6: 토요일

  const dayTypes: DayType[] = [];

  // 기본 요일 추가
  if (dayOfWeek === 0) {
    dayTypes.push("일요일");
  } else if (dayOfWeek === 6) {
    dayTypes.push("토요일");
  } else {
    dayTypes.push("평일");
  }

  // 공휴일 여부 추가
  if (isHoliday) {
    dayTypes.push("공휴일");
    dayTypes.push("휴일");
  }

  // 주말은 휴일로도 간주
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    dayTypes.push("휴일");
  }

  // 방학 여부 추가
  if (isVacation) {
    dayTypes.push("방학");
  }

  // 항상 공통 추가
  dayTypes.push("공통");

  return dayTypes;
}

/**
 * 요일 타입 그룹 문자열에서 개별 요일 타입 목록을 추출합니다.
 * @param dayTypeGroup 요일 타입 그룹 (예: "주말,공휴일")
 * @returns 요일 타입 목록
 */
export function getDayTypesFromGroup(dayTypeGroup: DayTypeGroup): DayType[] {
  // 패턴 매칭
  for (const pattern of DAY_TYPE_PATTERNS) {
    if (pattern.pattern === dayTypeGroup) {
      return pattern.pattern === "공통" ? ["공통"] : pattern.dayTypes;
    }
  }

  // 패턴에 없는 경우 쉼표로 분리해서 개별 타입으로 처리
  return dayTypeGroup.split(",").map((type) => type.trim() as DayType);
}
