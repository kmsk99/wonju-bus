import { getCurrentDayTypes, isDayTypeMatch, parseBusFileName } from "../model/dayTypeUtils";
import { BusData, DayType } from "../model/types";

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
 * 방학 모드 설정 함수 - 기능 비활성화로 아무 동작도 하지 않음
 */
export function setVacationMode(isVacation: boolean): void {
  // 기능 제거로 아무 동작도 하지 않음
  return;
}

/**
 * 공휴일 모드 설정 함수 - 기능 비활성화로 아무 동작도 하지 않음
 */
export function setHolidayMode(isHoliday: boolean): void {
  // 기능 제거로 아무 동작도 하지 않음
  return;
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

    // 각 파일의 데이터 가져오기 - 모든 파일을 로드하고 운행 여부만 표시
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
        // 파일명 정보 추가
        data.fileName = filename;

        // 현재 요일과 일치하는지 확인
        const fileInfo = parseBusFileName(filename);
        const operatesToday = isDayTypeMatch(
          fileInfo.dayTypeGroup,
          dataCache.isVacation,
          dataCache.isHoliday
        );

        // 버스 데이터에 operatesToday 정보 추가
        data.operatesToday = operatesToday;

        console.log(
          `파일 로드 성공: ${filename} (오늘 운행: ${
            operatesToday ? "예" : "아니오"
          })`
        );

        // 캐시에 저장 - 노선별로 첫 번째 파일만 캐시 (우선순위: 오늘 운행하는 파일)
        const routeNumber = data.routeInfo.routeNumber;
        if (!dataCache.busData[routeNumber] || operatesToday) {
          // 아직 캐시에 없거나, 오늘 운행하는 데이터가 들어오면 교체
          dataCache.busData[routeNumber] = data;
        }

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

    // 현재 요일에 맞는 파일과 그렇지 않은 파일 분류
    let matchingFiles: string[] = [];
    let nonMatchingFiles: string[] = [];

    for (const file of files) {
      const fileInfo = parseBusFileName(file);
      if (
        isDayTypeMatch(
          fileInfo.dayTypeGroup,
          dataCache.isVacation,
          dataCache.isHoliday
        )
      ) {
        matchingFiles.push(file);
      } else {
        nonMatchingFiles.push(file);
      }
    }

    // 일치하는 파일이 있으면 사용, 없으면 아무 파일이나 사용
    let fileToLoad = matchingFiles.length > 0 ? matchingFiles[0] : files[0];
    let operatesToday = matchingFiles.length > 0;

    // 파일 로드
    const fileUrl = `/data/${fileToLoad}`;
    console.log(`버스 노선 데이터 로드 중: ${fileUrl}`);
    const response = await fetch(fileUrl);

    if (!response.ok) {
      console.error(`버스 노선 ${routeNumber} 로드 실패: ${response.status}`);
      throw new Error(
        `버스 노선 ${routeNumber} 데이터를 가져오는데 실패했습니다: ${response.status}`
      );
    }

    const busData = (await response.json()) as BusData;
    // 파일명과 운행 여부 정보 추가
    busData.fileName = fileToLoad;
    busData.operatesToday = operatesToday;

    console.log(
      `버스 노선 ${routeNumber} 로드 성공 (파일: ${fileToLoad}, 오늘 운행: ${
        operatesToday ? "예" : "아니오"
      })`
    );

    // 캐시에 저장
    dataCache.busData[routeNumber] = busData;

    return busData;
  } catch (error) {
    console.error(`버스 노선 ${routeNumber} 데이터 로드 오류:`, error);
    return null;
  }
}

/**
 * 해당 노선이 오늘 운행하는지 확인합니다
 */
export async function isRouteOperatingToday(
  routeNumber: string
): Promise<boolean> {
  const busData = await loadBusData(routeNumber);
  if (!busData) return false;

  // operatesToday 속성이 이미 설정되어 있으면 그 값을 반환
  if (busData.operatesToday !== undefined) {
    return busData.operatesToday;
  }

  // 파일 이름에서 요일 정보 가져오기
  if (busData.fileName) {
    const fileInfo = parseBusFileName(busData.fileName);
    if (
      isDayTypeMatch(
        fileInfo.dayTypeGroup,
        dataCache.isVacation,
        dataCache.isHoliday
      )
    ) {
      return true;
    }
  }

  // operationInfo를 기반으로 확인
  if (busData.operationInfo && busData.operationInfo.length > 0) {
    // 현재 dayType 상태 가져오기
    const currentDayTypes = getCurrentDayTypes(
      dataCache.isVacation,
      dataCache.isHoliday
    );

    // 현재 dayType과 일치하는 운행 정보가 있는지 확인
    const hasMatchingOperation = busData.operationInfo.some(
      (op) =>
        currentDayTypes.includes(op.category as DayType) ||
        op.category === "공통"
    );

    return hasMatchingOperation;
  }

  // 정보가 없으면 기본적으로 운행한다고 가정
  return true;
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
    isNextDay?: boolean; // 다음 날 출발 여부
    tripIndex?: number; // 회차 번호
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
    isNextDay?: boolean;
    tripIndex?: number;
  }> = [];

  // 각 노선별 출발 시간 확인
  for (const route of allRoutes) {
    const busData = await loadBusData(route);
    if (!busData) continue;

    // 시간 정렬을 위한 임시 배열
    const tempTimes: Array<{
      departureTime: string;
      category: string;
      isFromTerminal: boolean;
      tripIndex?: number;
    }> = [];

    // 출발지로서의 시간
    busData.operationInfo.forEach((op, index) => {
      if (op.departureName === stopName && op.departureTime !== "-") {
        tempTimes.push({
          departureTime: op.departureTime,
          category: op.category,
          isFromTerminal: true,
          tripIndex: index + 1, // 회차 번호는 1부터 시작
        });
      }
    });

    // 도착지로서의 시간 (회차 시간)
    busData.operationInfo.forEach((op, index) => {
      if (op.arrivalName === stopName && op.arrivalTime !== "-") {
        tempTimes.push({
          departureTime: op.arrivalTime,
          category: op.category,
          isFromTerminal: false,
          tripIndex: index + 1, // 회차 번호는 1부터 시작
        });
      }
    });

    // 시간 순서로 정렬
    tempTimes.sort((a, b) => {
      // 시간을 분으로 변환
      const getTimeMinutes = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };

      return getTimeMinutes(a.departureTime) - getTimeMinutes(b.departureTime);
    });

    // 정렬된 시간을 결과에 추가
    for (const item of tempTimes) {
      const now = new Date();
      const [hours, minutes] = item.departureTime.split(":").map(Number);
      const departureTime = new Date(now);
      departureTime.setHours(hours, minutes, 0, 0);

      // 지난 시간인 경우 다음날로 설정
      let isNextDay = false;
      if (departureTime < now) {
        departureTime.setDate(departureTime.getDate() + 1);
        isNextDay = true;
      }

      const nextDepartureMinutes = Math.floor(
        (departureTime.getTime() - now.getTime()) / (1000 * 60)
      );

      result.push({
        routeNumber: route,
        departureTime: item.departureTime,
        nextDepartureMinutes,
        category: item.category,
        isFromTerminal: item.isFromTerminal,
        isNextDay,
        tripIndex: item.tripIndex,
      });
    }
  }

  // 출발 시간 기준으로 정렬 (오름차순)
  result.sort((a, b) => {
    // 시간을 분으로 변환
    const getTimeMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    // 시간 계산 - 항상 오름차순 정렬
    const timeA = getTimeMinutes(a.departureTime);
    const timeB = getTimeMinutes(b.departureTime);
    return timeA - timeB;
  });

  return result;
}
