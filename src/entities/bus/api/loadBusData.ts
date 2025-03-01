import { getCurrentDayTypes, isDayTypeMatch, parseBusFileName } from "../model/dayTypeUtils";
import { BusData } from "../model/types";

// 전역 캐시 객체 - 데이터를 한 번만 로드하기 위함
const dataCache: {
  busData: Record<string, BusData>;
  busFilesByRoute: Record<string, string[]>; // 노선별 파일 목록
  terminals: string[] | null;
  routesByTerminal: Record<string, string[]>; // 출발하는 노선
  routesToTerminal: Record<string, string[]>; // 도착하는 노선
  routesCountByTerminal: Record<string, number>;
  isVacation: boolean; // 방학 여부
  isHoliday: boolean; // 공휴일 여부
} = {
  busData: {},
  busFilesByRoute: {},
  terminals: null,
  routesByTerminal: {},
  routesToTerminal: {},
  routesCountByTerminal: {},
  isVacation: false, // 방학 여부는 기본적으로 false
  isHoliday: false, // 공휴일 여부는 기본적으로 false
};

/**
 * 방학 여부를 설정합니다.
 * @param isVacation 방학 여부
 */
export function setVacationMode(isVacation: boolean): void {
  if (dataCache.isVacation !== isVacation) {
    dataCache.isVacation = isVacation;
    // 캐시 초기화 (방학 여부가 바뀌면 버스 데이터도 바뀔 수 있음)
    dataCache.busData = {};
  }
}

/**
 * 공휴일 여부를 설정합니다.
 * @param isHoliday 공휴일 여부
 */
export function setHolidayMode(isHoliday: boolean): void {
  if (dataCache.isHoliday !== isHoliday) {
    dataCache.isHoliday = isHoliday;
    // 캐시 초기화 (공휴일 여부가 바뀌면 버스 데이터도 바뀔 수 있음)
    dataCache.busData = {};
  }
}

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

    // 노선별 파일 목록 생성
    busFiles.forEach((filename) => {
      const fileInfo = parseBusFileName(filename);
      if (!dataCache.busFilesByRoute[fileInfo.routeNumber]) {
        dataCache.busFilesByRoute[fileInfo.routeNumber] = [];
      }
      dataCache.busFilesByRoute[fileInfo.routeNumber].push(filename);
    });

    // 각 파일의 데이터 가져오기
    const busDataPromises = busFiles
      .filter((filename) => {
        // 파일명에서 dayType 정보 추출
        const fileInfo = parseBusFileName(filename);
        // 현재 dayType과 일치하는 파일만 가져오기
        return isDayTypeMatch(
          fileInfo.dayTypeGroup,
          dataCache.isVacation,
          dataCache.isHoliday
        );
      })
      .map(async (filename) => {
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
          // 파일명 정보 추가
          data.fileName = filename;
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
    // 노선에 대한 파일 목록이 없으면 먼저 모든 파일 목록 로드
    if (!dataCache.busFilesByRoute[routeNumber]) {
      await loadAllBusData();
    }

    // 노선에 대한 파일 목록 가져오기
    const files = dataCache.busFilesByRoute[routeNumber] || [];
    if (files.length === 0) {
      console.error(`버스 노선 ${routeNumber}에 대한 파일이 없습니다.`);
      return null;
    }

    // 현재 날짜에 맞는 파일 찾기
    let matchedFile: string | null = null;
    for (const file of files) {
      const fileInfo = parseBusFileName(file);
      if (
        isDayTypeMatch(
          fileInfo.dayTypeGroup,
          dataCache.isVacation,
          dataCache.isHoliday
        )
      ) {
        matchedFile = file;
        break;
      }
    }

    // 맞는 파일이 없으면 아무 파일이나 사용
    if (!matchedFile) {
      console.warn(
        `버스 노선 ${routeNumber}에 현재 날짜에 맞는 파일이 없어 첫 번째 파일을 사용합니다.`
      );
      matchedFile = files[0];
    }

    // 파일 로드
    const fileUrl = `/data/${matchedFile}`;
    console.log(`버스 노선 데이터 로드 중: ${fileUrl}`);
    const response = await fetch(fileUrl);

    if (!response.ok) {
      console.error(`버스 노선 ${routeNumber} 로드 실패: ${response.status}`);
      throw new Error(
        `버스 노선 ${routeNumber} 데이터를 가져오는데 실패했습니다: ${response.status}`
      );
    }

    const busData = (await response.json()) as BusData;
    // 파일명 정보 추가
    busData.fileName = matchedFile;
    console.log(`버스 노선 ${routeNumber} 로드 성공 (파일: ${matchedFile})`);

    // 캐시에 저장
    dataCache.busData[routeNumber] = busData;

    return busData;
  } catch (error) {
    console.error(`버스 노선 ${routeNumber} 데이터 로드 오류:`, error);
    return null;
  }
}

/**
 * 현재 요일과 상황(방학, 공휴일 등)에 따른 데이터 로드 여부를 확인합니다.
 * @param routeNumber 버스 노선 번호
 * @returns 오늘 운행 여부
 */
export async function isRouteOperatingToday(
  routeNumber: string
): Promise<boolean> {
  // 노선에 대한 데이터 로드
  const busData = await loadBusData(routeNumber);
  if (!busData) return false;

  // 파일 이름에서 요일 정보 확인
  if (busData.fileName) {
    const fileInfo = parseBusFileName(busData.fileName);
    return isDayTypeMatch(
      fileInfo.dayTypeGroup,
      dataCache.isVacation,
      dataCache.isHoliday
    );
  }

  // 파일 이름 정보가 없으면 operationInfo에서 확인
  const currentDayTypes = getCurrentDayTypes(
    dataCache.isVacation,
    dataCache.isHoliday
  );
  return busData.operationInfo.some(
    (op) =>
      currentDayTypes.includes(op.category as any) || op.category === "공통"
  );
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
      // '-'가 아닌 종점만 추가
      if (op.departureName !== "-") {
        terminals.add(op.departureName);

        // 종점별 노선 수 계산
        if (!routesCountByTerminal[op.departureName]) {
          routesCountByTerminal[op.departureName] = 0;
        }
        routesCountByTerminal[op.departureName]++;
      }

      if (op.arrivalName !== "-") {
        terminals.add(op.arrivalName);

        if (!routesCountByTerminal[op.arrivalName]) {
          routesCountByTerminal[op.arrivalName] = 0;
        }
        routesCountByTerminal[op.arrivalName]++;
      }
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

  console.log(`${terminalName} 종점의 출발 노선 목록 로드 시작`);
  // 모든 버스 데이터 로드
  const busDataList = await loadAllBusData();

  // 특정 종점에서 출발하는 버스 노선 필터링
  const routesFromTerminal = busDataList
    .filter((busData) =>
      busData.operationInfo.some((op) => op.departureName === terminalName)
    )
    .map((busData) => busData.routeInfo.routeNumber);

  console.log(
    `${terminalName} 종점의 출발 노선 목록 로드 완료: ${routesFromTerminal.length}개 노선`
  );

  // 캐시에 저장
  dataCache.routesByTerminal[terminalName] = routesFromTerminal;

  return routesFromTerminal;
}

/**
 * 종점에 도착하는 버스 노선 목록을 로드합니다.
 * @param terminalName 종점 이름
 * @returns 해당 종점에 도착하는 버스 노선 번호 목록
 */
export async function loadRoutesToTerminal(
  terminalName: string
): Promise<string[]> {
  // 캐시에 있으면 캐시에서 반환
  if (dataCache.routesToTerminal[terminalName]) {
    return dataCache.routesToTerminal[terminalName];
  }

  console.log(`${terminalName} 종점의 도착 노선 목록 로드 시작`);
  // 모든 버스 데이터 로드
  const busDataList = await loadAllBusData();

  // 특정 종점에 도착하는 버스 노선 필터링
  const routesToTerminal = busDataList
    .filter((busData) =>
      busData.operationInfo.some((op) => op.arrivalName === terminalName)
    )
    .map((busData) => busData.routeInfo.routeNumber);

  console.log(
    `${terminalName} 종점의 도착 노선 목록 로드 완료: ${routesToTerminal.length}개 노선`
  );

  // 캐시에 저장
  dataCache.routesToTerminal[terminalName] = routesToTerminal;

  return routesToTerminal;
}

/**
 * 버스 정보에서 특정 종점의 출발 시간 목록을 가져옵니다.
 * @param routeNumber 버스 노선 번호
 * @param stopName 종점 이름
 * @returns 출발 시간 목록 (도착지인 경우 회차 시간으로 간주)
 */
export async function getBusDepartureTimes(
  routeNumber: string,
  stopName: string
): Promise<{ times: string[]; categories: string[] }> {
  const busData = await loadBusData(routeNumber);
  if (!busData) return { times: [], categories: [] };

  const departureTimes: string[] = [];
  const categories: string[] = [];

  // 출발지로서의 시간
  busData.operationInfo.forEach((op) => {
    if (op.departureName === stopName && op.departureTime !== "-") {
      departureTimes.push(op.departureTime);
      categories.push(op.category);
    }
  });

  // 도착지로서의 시간 (회차 시간)
  busData.operationInfo.forEach((op) => {
    if (op.arrivalName === stopName && op.arrivalTime !== "-") {
      departureTimes.push(op.arrivalTime);
      categories.push(op.category);
    }
  });

  return { times: departureTimes, categories };
}

/**
 * 현재 시간 기준으로 다음 버스 출발까지 남은 시간을 계산합니다.
 * @param departureTime 출발 시간 (24시간 형식, ex: "13:45")
 * @returns 남은 시간 (분 단위, 이미 지난 경우 -1)
 */
export function getTimeUntilNextBus(departureTime: string): number {
  const now = new Date();
  const [hours, minutes] = departureTime.split(":").map(Number);

  const departureDate = new Date();
  departureDate.setHours(hours);
  departureDate.setMinutes(minutes);
  departureDate.setSeconds(0);

  // 이미 지난 경우 다음 날로 설정
  if (departureDate.getTime() < now.getTime()) {
    return -1;
  }

  const diffMs = departureDate.getTime() - now.getTime();
  return Math.floor(diffMs / 60000); // 분 단위로 변환
}

/**
 * 특정 종점의 모든 버스 출발 시간을 가져옵니다.
 * @param stopName 종점 이름
 * @returns 노선별 출발 시간 목록
 */
export async function getAllDepartureTimesFromStop(stopName: string): Promise<
  Array<{
    routeNumber: string;
    departureTime: string;
    nextDepartureMinutes: number;
    category: string;
    isFromTerminal: boolean; // true: 출발지, false: 도착지(회차)
  }>
> {
  // 해당 종점에서 출발하는 모든 노선
  const departureRoutes = await loadRoutesByTerminal(stopName);
  const arrivalRoutes = await loadRoutesToTerminal(stopName);

  // 모든 노선 통합 (중복 제거)
  const allRoutes = Array.from(new Set([...departureRoutes, ...arrivalRoutes]));

  const result: Array<{
    routeNumber: string;
    departureTime: string;
    nextDepartureMinutes: number;
    category: string;
    isFromTerminal: boolean;
  }> = [];

  // 각 노선별 출발 시간 확인
  for (const route of allRoutes) {
    const busData = await loadBusData(route);
    if (!busData) continue;

    // 출발지로서의 시간
    busData.operationInfo.forEach((op) => {
      if (op.departureName === stopName && op.departureTime !== "-") {
        const nextDepartureMinutes = getTimeUntilNextBus(op.departureTime);
        result.push({
          routeNumber: route,
          departureTime: op.departureTime,
          nextDepartureMinutes,
          category: op.category,
          isFromTerminal: true,
        });
      }
    });

    // 도착지로서의 시간 (회차 시간)
    busData.operationInfo.forEach((op) => {
      if (op.arrivalName === stopName && op.arrivalTime !== "-") {
        const nextDepartureMinutes = getTimeUntilNextBus(op.arrivalTime);
        result.push({
          routeNumber: route,
          departureTime: op.arrivalTime,
          nextDepartureMinutes,
          category: op.category,
          isFromTerminal: false,
        });
      }
    });
  }

  // 출발 시간 기준으로 정렬 (오름차순)
  result.sort((a, b) => {
    // 이미 지난 시간은 뒤로
    if (a.nextDepartureMinutes === -1 && b.nextDepartureMinutes !== -1)
      return 1;
    if (a.nextDepartureMinutes !== -1 && b.nextDepartureMinutes === -1)
      return -1;

    // 둘 다 지났거나 둘 다 안 지난 경우 시간순
    return a.nextDepartureMinutes - b.nextDepartureMinutes;
  });

  return result;
}
