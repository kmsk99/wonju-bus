// 버스 노선 기본 정보 타입
export interface BusRouteInfo {
  routeNumber: string; // 노선번호
  origin: string; // 기점
  destination: string; // 종점
  firstBusTime: string; // 첫차
  lastBusTime: string; // 막차
  operationCount: string; // 운행수
  interval: string; // 배차간격
}

// 버스 노선별 상세 운행 정보 타입
export interface BusOperationInfo {
  operationNumber: string; // 운행 순번
  departureTime: string; // 출발 시간
  arrivalTime: string; // 도착 시간
  departureName: string; // 출발지 이름 (예: 중앙시장, 관설동종점 등)
  arrivalName: string; // 도착지 이름 (예: 용곡, 횡성 등)
  category: string; // 구분 (예: 평일, 주말, 공통 등)
  note: string; // 비고 (경유지, 특이사항 등)
}

// 전체 버스 정보 타입
export interface BusInfo {
  routeInfo: BusRouteInfo;
  operationInfo: BusOperationInfo[];
}
