import { BusData } from "../model/types";

// 전역 캐시 객체 - 데이터를 한 번만 로드하기 위함
const dataCache: {
  busData: Record<string, BusData>;
  terminals: string[] | null;
  routesByTerminal: Record<string, string[]>;
  routesCountByTerminal: Record<string, number>;
} = {
  busData: {},
  terminals: null,
  routesByTerminal: {},
  routesCountByTerminal: {},
};

/**
 * 데이터 폴더에서 모든 버스 데이터를 로드합니다.
 */
export async function loadAllBusData(): Promise<BusData[]> {
  try {
    console.log("버스 데이터 목록 로드 시작");
    // 데이터 파일 목록을 가져오는 API 엔드포인트 호출
    const response = await fetch("/data/bus-files.json");
    if (!response.ok) {
      console.error(
        `버스 파일 목록 가져오기 실패: ${response.status} ${response.statusText}`
      );
      throw new Error(
        `버스 파일 목록을 가져오는데 실패했습니다: ${response.status}`
      );
    }

    const busFiles = (await response.json()) as string[];
    console.log(`버스 파일 목록 로드 완료: ${busFiles.length}개 파일`);

    // 각 파일의 데이터 가져오기
    const busDataPromises = busFiles.map(async (filename) => {
      try {
        const fileUrl = `/data/${filename}`;
        console.log(`파일 로드 중: ${fileUrl}`);
        const dataResponse = await fetch(fileUrl);

        if (!dataResponse.ok) {
          console.error(
            `파일 로드 실패: ${filename}, 상태: ${dataResponse.status}`
          );
          throw new Error(`${filename} 데이터를 가져오는데 실패했습니다.`);
        }

        const data = (await dataResponse.json()) as BusData;
        console.log(`파일 로드 성공: ${filename}`);

        // 캐시에 저장
        const routeNumber = data.routeInfo.routeNumber;
        dataCache.busData[routeNumber] = data;

        return data;
      } catch (error) {
        console.error(`${filename} 파일 처리 중 오류:`, error);
        return null;
      }
    });

    const results = await Promise.all(busDataPromises);
    const validResults = results.filter((item) => item !== null) as BusData[];
    console.log(`총 ${validResults.length}개 버스 데이터 로드 완료`);
    return validResults;
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
    const fileUrl = `/data/wonju-bus-${routeNumber}.json`;
    console.log(`버스 노선 데이터 로드 중: ${fileUrl}`);
    const response = await fetch(fileUrl);

    if (!response.ok) {
      console.error(`버스 노선 ${routeNumber} 로드 실패: ${response.status}`);
      throw new Error(
        `버스 노선 ${routeNumber} 데이터를 가져오는데 실패했습니다: ${response.status}`
      );
    }

    const busData = (await response.json()) as BusData;
    console.log(`버스 노선 ${routeNumber} 로드 성공`);

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

  console.log("종점 목록 로드 시작");
  // 모든 버스 데이터 로드
  const busDataList = await loadAllBusData();
  console.log(`종점 목록 추출 중: ${busDataList.length}개 버스 데이터 사용`);

  // 모든 종점 추출 (중복 제거)
  const terminals = new Set<string>();
  const routesCountByTerminal: Record<string, number> = {};

  busDataList.forEach((bus) => {
    bus.operationInfo.forEach((op) => {
      terminals.add(op.departureName);
      terminals.add(op.arrivalName);

      // 종점별 노선 수 계산
      if (!routesCountByTerminal[op.departureName]) {
        routesCountByTerminal[op.departureName] = 0;
      }
      routesCountByTerminal[op.departureName]++;

      if (!routesCountByTerminal[op.arrivalName]) {
        routesCountByTerminal[op.arrivalName] = 0;
      }
      routesCountByTerminal[op.arrivalName]++;
    });
  });

  // 종점별 노선 수 캐싱
  dataCache.routesCountByTerminal = routesCountByTerminal;

  // 종점을 노선 수 기준으로 정렬 (내림차순)
  const terminalsList = Array.from(terminals).sort((a, b) => {
    return (routesCountByTerminal[b] || 0) - (routesCountByTerminal[a] || 0);
  });

  console.log(`종점 목록 로드 완료: ${terminalsList.length}개 종점`);

  // 캐시에 저장
  dataCache.terminals = terminalsList;

  return terminalsList;
}

/**
 * 종점에 연결된 노선 수를 가져옵니다.
 * @param terminalName 종점 이름
 * @returns 해당 종점의 노선 수
 */
export function getRouteCountForTerminal(terminalName: string): number {
  return dataCache.routesCountByTerminal[terminalName] || 0;
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

  console.log(`${terminalName} 종점의 노선 목록 로드 시작`);
  // 모든 버스 데이터 로드
  const busDataList = await loadAllBusData();

  // 특정 종점에서 출발하는 버스 노선 필터링
  const routesFromTerminal = busDataList
    .filter((busData) =>
      busData.operationInfo.some((op) => op.departureName === terminalName)
    )
    .map((busData) => busData.routeInfo.routeNumber);

  console.log(
    `${terminalName} 종점의 노선 목록 로드 완료: ${routesFromTerminal.length}개 노선`
  );

  // 캐시에 저장
  dataCache.routesByTerminal[terminalName] = routesFromTerminal;

  return routesFromTerminal;
}
