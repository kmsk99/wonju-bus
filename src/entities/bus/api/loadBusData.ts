import { BusData } from "../model/types";

/**
 * 버스 데이터를 로드합니다.
 * @param routeNumber 버스 노선 번호
 * @returns 버스 데이터 객체
 */
export async function loadBusData(routeNumber: string): Promise<BusData> {
  try {
    // Next.js API 라우트를 통해 데이터 로드
    const response = await fetch(`/api/bus/${routeNumber}`);

    if (!response.ok) {
      throw new Error(`버스 데이터 로드 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("버스 데이터 로드 오류:", error);
    throw error;
  }
}

/**
 * 모든 종점 목록을 로드합니다.
 * @returns 종점 목록 (중복 제거)
 */
export async function loadTerminals(): Promise<string[]> {
  try {
    const response = await fetch("/api/terminals");

    if (!response.ok) {
      throw new Error(`종점 목록 로드 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("종점 목록 로드 오류:", error);
    throw error;
  }
}

/**
 * 종점에서 출발하는 버스 노선 목록을 로드합니다.
 * @param terminalName 종점 이름
 * @returns 해당 종점에서 출발하는 버스 노선 번호 목록
 */
export async function loadRoutesByTerminal(
  terminalName: string
): Promise<string[]> {
  try {
    const response = await fetch(
      `/api/terminals/${encodeURIComponent(terminalName)}/routes`
    );

    if (!response.ok) {
      throw new Error(`노선 목록 로드 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("노선 목록 로드 오류:", error);
    throw error;
  }
}
