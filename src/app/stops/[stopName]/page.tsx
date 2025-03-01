"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
    getAllDepartureTimesFromStop, isRouteOperatingToday, loadBusData, loadRoutesByTerminal,
    loadRoutesToTerminal
} from "@/entities/bus/api/loadBusData";
import { useDayTypeStore } from "@/entities/bus/model/dayTypeState";
import { BusDepartureTable } from "@/widgets/BusDepartureTable";
import { RoutesList } from "@/widgets/RoutesList";
import { StopDetailHeader } from "@/widgets/StopDetailHeader";
import { StopDetailTabs } from "@/widgets/StopDetailTabs";

interface DepartureInfo {
  routeNumber: string;
  departureTime: string;
  nextDepartureMinutes: number;
  category: string;
  isFromTerminal: boolean;
  isNextDay?: boolean;
  tripIndex?: number;
}

interface GroupedDeparture {
  nextDeparture: DepartureInfo;
  remainingCount: number;
  operatesToday: boolean;
}

export default function StopDetailPage() {
  const params = useParams<{ stopName: string }>();
  const stopName = params?.stopName ? decodeURIComponent(params.stopName) : "";
  const { updateDayTypes } = useDayTypeStore();

  // 노선 데이터 상태
  const [departureRoutes, setDepartureRoutes] = useState<string[]>([]);
  const [arrivalRoutes, setArrivalRoutes] = useState<string[]>([]);
  const [departureTimes, setDepartureTimes] = useState<DepartureInfo[]>([]);
  const [groupedDepartures, setGroupedDepartures] = useState<
    Record<string, GroupedDeparture>
  >({});

  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "from" | "to">("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 클라이언트 사이드에서만 렌더링에 영향을 미치는 상태 추가
  const [clientSideMount, setClientSideMount] = useState(false);
  const [renderReady, setRenderReady] = useState(false);

  // 초기 마운트 후 클라이언트 사이드 상태 업데이트
  useEffect(() => {
    setClientSideMount(true);
    // 강제로 정적 초기 화면 보여줌
    setTimeout(() => {
      setRenderReady(true);
    }, 10); // 매우 짧은 지연으로 렌더링 사이클 보장
  }, []);

  // 1분마다 현재 시간 및 시간표 업데이트
  useEffect(() => {
    // 초기 로드
    updateDayTypes();

    // Next.js에서는 useEffect 내에서만 window를 참조해야 함
    if (typeof window !== "undefined") {
      // 페이지 위치 강제 리셋 (여러 방법으로 시도)
      window.scrollTo(0, 0);

      // 강제로 뷰포트 맨 위로 스크롤
      window.scrollTo({
        top: 0,
        behavior: "auto",
      });

      // 스크롤 이벤트 강제 발생
      const scrollEvent = new Event("scroll");
      window.dispatchEvent(scrollEvent);
    }

    // 시간표 업데이트 인터벌 설정
    const interval = setInterval(() => {
      updateDayTypes();
      // 시간표 다시 로드
      loadDepartureTimes();
    }, 60000);

    return () => clearInterval(interval);
  }, [stopName, updateDayTypes]);

  // 출발/도착 노선 로드
  useEffect(() => {
    async function fetchRoutesForStop() {
      try {
        console.log(`${stopName} 종점의 노선 목록 로딩 시작...`);
        setIsLoading(true);

        // 비동기 작업을 병렬로 처리
        const [fromRoutes, toRoutes] = await Promise.all([
          loadRoutesByTerminal(stopName),
          loadRoutesToTerminal(stopName),
        ]);

        setDepartureRoutes(fromRoutes);
        console.log(`${stopName}에서 출발하는 노선: ${fromRoutes.length}개`);

        setArrivalRoutes(toRoutes);
        console.log(`${stopName}에 도착하는 노선: ${toRoutes.length}개`);

        // 출발 시간표
        await loadDepartureTimes();
      } catch (err) {
        console.error(`${stopName} 종점 데이터 로딩 중 오류 발생:`, err);
        setError("버스 노선 데이터를 로드하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
        console.log(`${stopName} 종점의 노선 목록 로딩 완료`);
      }
    }

    if (stopName) {
      fetchRoutesForStop();
    }
  }, [stopName]);

  // 출발 시간표 로드 함수
  async function loadDepartureTimes() {
    try {
      const times = await getAllDepartureTimesFromStop(stopName);
      setDepartureTimes(times);
      console.log(`${stopName}의 출발 시간표 ${times.length}개 로드 완료`);

      // 노선별로 그룹화하고 남은 버스 개수 계산
      const grouped: Record<string, GroupedDeparture> = {};

      // 현재 시간
      const now = new Date();

      // 모든 노선 목록 가져오기
      const uniqueRoutes = Array.from(
        new Set(times.map((time) => time.routeNumber))
      );

      // 각 노선에 대해 운행 정보 가져오기
      for (const routeNumber of uniqueRoutes) {
        const busData = await loadBusData(routeNumber);
        if (!busData) continue;

        // 해당 노선의 모든 출발 시간
        const routeTimes = times.filter(
          (time) => time.routeNumber === routeNumber
        );

        // 시간순 정렬
        routeTimes.sort((a, b) => {
          // 시간을 분으로 변환
          const getTimeMinutes = (time: string) => {
            const [hours, minutes] = time.split(":").map(Number);
            return hours * 60 + minutes;
          };

          // 항상 오름차순 정렬
          return (
            getTimeMinutes(a.departureTime) - getTimeMinutes(b.departureTime)
          );
        });

        // 아직 출발하지 않은 시간들
        const remainingTimes = routeTimes.filter(
          (time) => time.nextDepartureMinutes >= 0
        );

        // 가장 가까운 출발
        const nextDeparture =
          remainingTimes.length > 0 ? remainingTimes[0] : routeTimes[0]; // 모두 지났으면 첫 번째 출발 표시

        // 오늘 운행 여부 확인
        const operatesToday = await isRouteOperatingToday(routeNumber);

        // 오늘 남은 운행 횟수 계산
        let remainingCount = 0;
        if (operatesToday) {
          // 아직 출발하지 않은 운행 개수
          remainingCount = remainingTimes.length;
        }

        // 결과 저장
        grouped[routeNumber] = {
          nextDeparture,
          remainingCount,
          operatesToday,
        };
      }

      setGroupedDepartures(grouped);
    } catch (err) {
      console.error(`${stopName} 출발 시간표 로딩 중 오류:`, err);
    }
  }

  // 필터링된 그룹화 출발 시간표
  const filteredDepartures = Object.entries(groupedDepartures)
    .filter(([_, data]) => {
      if (activeTab === "all") return true;
      if (activeTab === "from") return data.nextDeparture.isFromTerminal;
      if (activeTab === "to") return !data.nextDeparture.isFromTerminal;
      return true;
    })
    .sort((a, b) => {
      // 1. 운행일 기준 정렬 (운행하는 날이 먼저 오도록)
      if (a[1].operatesToday !== b[1].operatesToday) {
        return a[1].operatesToday ? -1 : 1;
      }

      // 시간 문자열을 분 단위로 변환 (예: "08:30" -> 510)
      const getTimeMinutes = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };

      // 시간 기준으로 항상 오름차순 정렬
      const timeA = getTimeMinutes(a[1].nextDeparture.departureTime);
      const timeB = getTimeMinutes(b[1].nextDeparture.departureTime);
      return timeA - timeB;
    })
    .map(([routeNumber, data]) => ({
      routeNumber,
      departureTime: data.nextDeparture.departureTime,
      nextDepartureMinutes: data.nextDeparture.nextDepartureMinutes,
      category: data.nextDeparture.category,
      isFromTerminal: data.nextDeparture.isFromTerminal,
      remainingCount: data.remainingCount,
      operatesToday: data.operatesToday,
      isNextDay: data.nextDeparture.isNextDay,
      tripIndex: data.nextDeparture.tripIndex,
    }));

  // 노선 목록 데이터 변환
  const routeListData = Array.from(
    new Set([...departureRoutes, ...arrivalRoutes])
  ).map((routeNumber) => {
    const routeData = groupedDepartures[routeNumber];
    return {
      routeNumber,
      isDeparture: departureRoutes.includes(routeNumber),
      isArrival: arrivalRoutes.includes(routeNumber),
      remainingCount: routeData?.remainingCount || 0,
      operatesToday: routeData?.operatesToday || false,
    };
  });

  return (
    <div className="container mx-auto p-3">
      {/* 고정된 헤더 영역 (항상 표시) */}
      <div className="mb-6">
        <StopDetailHeader stopName={stopName} />
      </div>

      {/* 탭 영역 */}
      <div className="mb-4">
        <StopDetailTabs
          activeTab={activeTab}
          departureRoutesCount={departureRoutes.length}
          arrivalRoutesCount={arrivalRoutes.length}
          onTabChange={setActiveTab}
        />
      </div>

      {/* 동적 콘텐츠 영역 - 조건부 렌더링은 여기에서 처리 */}
      <div>
        {/* 초기 렌더링 및 로딩 상태 표시 */}
        {(!renderReady || !clientSideMount) && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
              <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-20 bg-gray-100 rounded-lg"></div>
                <div className="h-20 bg-gray-100 rounded-lg"></div>
                <div className="h-20 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 상태 표시 */}
        {renderReady && clientSideMount && isLoading && (
          <div className="my-8 flex flex-col items-center justify-center bg-white rounded-lg shadow-sm py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 text-center">
              "{stopName}" 정류장 정보를 불러오는 중입니다.
              <br />
              잠시만 기다려주세요.
            </p>
          </div>
        )}

        {/* 에러 상태 표시 */}
        {renderReady && clientSideMount && !isLoading && error && (
          <div className="my-8 bg-red-50 text-red-500 p-4 rounded-lg text-center">
            <p className="mb-3">{error}</p>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 콘텐츠 표시 */}
        {renderReady && clientSideMount && !isLoading && !error && (
          <>
            {/* 출발 시간 영역 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3">다음 출발 시간</h2>
              <BusDepartureTable
                departures={filteredDepartures}
                isLoading={false}
                error={null}
              />
            </div>

            {/* 노선 목록 영역 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3">노선 목록</h2>
              <RoutesList routes={routeListData} />
            </div>
          </>
        )}
      </div>

      {/* 하단 네비게이션 영역 (항상 표시) */}
      <div className="mt-8 text-center py-4">
        <Link
          href="/stops"
          className="text-blue-500 hover:underline mr-6 inline-flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          종점 목록으로 돌아가기
        </Link>
        <Link
          href="/"
          className="text-blue-500 hover:underline inline-flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
