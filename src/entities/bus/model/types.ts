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
}

export type DayType = "평일" | "토요일" | "일요일" | "공휴일" | "방학" | "공통";
