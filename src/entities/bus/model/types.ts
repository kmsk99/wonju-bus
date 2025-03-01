export interface BusRouteInfo {
  routeNumber: string;
  origin: string;
  destination: string;
  firstBusTime: string;
  lastBusTime: string;
  operationCount: string;
  interval: string;
}

export interface BusOperationInfo {
  operationNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureName: string;
  arrivalName: string;
  category: string; // 평일, 토요일, 일요일, 공휴일, 방학 등
  note: string;
}

export interface BusData {
  routeInfo: BusRouteInfo;
  operationInfo: BusOperationInfo[];
  fileName?: string; // 파일 이름 정보 추가
}

// 개별 요일 타입
export type DayType =
  | "평일"
  | "토요일"
  | "일요일"
  | "공휴일"
  | "방학"
  | "휴일"
  | "공통";

// 하나의 파일에 포함될 수 있는 여러 요일 타입
export type DayTypeGroup = string; // 예: "평일", "주말,공휴일", "방학,휴일" 등

// 파일 이름에 포함된 요일 타입 패턴
export interface DayTypePattern {
  pattern: string;
  dayTypes: DayType[];
}

// 버스 파일 정보
export interface BusFileInfo {
  routeNumber: string;
  dayTypeGroup: DayTypeGroup | null;
  fileName: string;
}
