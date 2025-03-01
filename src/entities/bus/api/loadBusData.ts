import { BusData } from "../model/types";

// 전역 캐시 객체 - 데이터를 한 번만 로드하기 위함
const dataCache: {
  busData: Record<string, BusData>;
  terminals: string[] | null;
  routesByTerminal: Record<string, string[]>;
} = {
  busData: {},
  terminals: null,
  routesByTerminal: {},
};

/**
 * 데이터 폴더에서 모든 버스 데이터를 로드합니다.
 */
async function loadAllBusData(): Promise<BusData[]> {
  try {
    // 데이터 파일 목록을 가져오는 API 엔드포인트 호출
    const response = await fetch("/data/bus-files.json");
    if (!response.ok) {
      throw new Error("버스 파일 목록을 가져오는데 실패했습니다.");
    }

    const busFiles = (await response.json()) as string[];

    // 각 파일의 데이터 가져오기
    const busDataPromises = busFiles.map(async (filename) => {
      const dataResponse = await fetch(`/data/${filename}`);
      if (!dataResponse.ok) {
        throw new Error(`${filename} 데이터를 가져오는데 실패했습니다.`);
      }

      const data = (await dataResponse.json()) as BusData;

      // 캐시에 저장
      const routeNumber = data.routeInfo.routeNumber;
      dataCache.busData[routeNumber] = data;

      return data;
    });

    return await Promise.all(busDataPromises);
  } catch (error) {
    console.error("버스 데이터 로드 오류:", error);
    return [];
  }
}

/**
 * 버스 데이터를 로드합니다.
 * @param routeNumber 버스 노선 번호
 * @returns 버스 데이터 객체
 */
export async function loadBusData(
  routeNumber: string
): Promise<BusData | null> {
  // 캐시에 있으면 캐시에서 반환
  if (dataCache.busData[routeNumber]) {
    return dataCache.busData[routeNumber];
  }

  try {
    // public 폴더의 데이터 파일에 접근
    const response = await fetch(`/data/wonju-bus-${routeNumber}.json`);
    if (!response.ok) {
      throw new Error(
        `버스 노선 ${routeNumber} 데이터를 가져오는데 실패했습니다.`
      );
    }

    const busData = (await response.json()) as BusData;

    // 캐시에 저장
    dataCache.busData[routeNumber] = busData;

    return busData;
  } catch (error) {
    console.error(`버스 노선 ${routeNumber} 데이터 로드 오류:`, error);
    return null;
  }
}

/**
 * 모든 종점 목록을 로드합니다.
 * @returns 종점 목록 (중복 제거)
 */
export async function loadTerminals(): Promise<string[]> {
  // 캐시에 있으면 캐시에서 반환
  if (dataCache.terminals) {
    return dataCache.terminals;
  }

  // 모든 버스 데이터 로드
  const busDataList = await loadAllBusData();

  // 모든 종점 추출 (중복 제거)
  const terminals = new Set<string>();

  busDataList.forEach((bus) => {
    bus.operationInfo.forEach((op) => {
      terminals.add(op.departureName);
      terminals.add(op.arrivalName);
    });
  });

  const terminalsList = Array.from(terminals);

  // 캐시에 저장
  dataCache.terminals = terminalsList;

  return terminalsList;
}

/**
 * 종점에서 출발하는 버스 노선 목록을 로드합니다.
 * @param terminalName 종점 이름
 * @returns 해당 종점에서 출발하는 버스 노선 번호 목록
 */
export async function loadRoutesByTerminal(
  terminalName: string
): Promise<string[]> {
  // 캐시에 있으면 캐시에서 반환
  if (dataCache.routesByTerminal[terminalName]) {
    return dataCache.routesByTerminal[terminalName];
  }

  // 모든 버스 데이터 로드
  const busDataList = await loadAllBusData();

  // 특정 종점에서 출발하는 버스 노선 필터링
  const routesFromTerminal = busDataList
    .filter((busData) =>
      busData.operationInfo.some((op) => op.departureName === terminalName)
    )
    .map((busData) => busData.routeInfo.routeNumber);

  // 캐시에 저장
  dataCache.routesByTerminal[terminalName] = routesFromTerminal;

  return routesFromTerminal;
}
