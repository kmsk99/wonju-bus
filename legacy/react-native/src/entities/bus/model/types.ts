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
  category: string;
  note: string;
}

export interface BusData {
  routeInfo: BusRouteInfo;
  operationInfo: BusOperationInfo[];
  fileName?: string;
  operatesToday?: boolean;
}

export type DayType =
  | '평일'
  | '토요일'
  | '일요일'
  | '공휴일'
  | '방학'
  | '휴일'
  | '공통';

export type DayTypeGroup = string;

export interface DayTypePattern {
  pattern: string;
  dayTypes: DayType[];
}

export interface BusFileInfo {
  routeNumber: string;
  dayTypeGroup: DayTypeGroup | null;
  fileName: string;
}
