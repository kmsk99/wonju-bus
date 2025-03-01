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

  // 1분마다 현재 시간 및 시간표 업데이트
  useEffect(() => {
    // 초기 로드
    updateDayTypes();

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

        // 출발 노선
        const fromRoutes = await loadRoutesByTerminal(stopName);
        setDepartureRoutes(fromRoutes);
        console.log(`${stopName}에서 출발하는 노선: ${fromRoutes.length}개`);

        // 도착 노선
        const toRoutes = await loadRoutesToTerminal(stopName);
        setArrivalRoutes(toRoutes);
        console.log(`${stopName}에 도착하는 노선: ${toRoutes.length}개`);

        // 출발 시간표
        await loadDepartureTimes();
      } catch (err) {
        console.error(`${stopName} 종점 데이터 로딩 중 오류 발생:`, err);
        setError("버스 노선 데이터를 로드하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
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
      // 1. 오늘 운행하지 않는 노선은 맨 뒤로
      if (a[1].operatesToday && !b[1].operatesToday) return -1;
      if (!a[1].operatesToday && b[1].operatesToday) return 1;

      // 2. 같은 운행 상태면, 출발 시간 기준으로 정렬
      // 이미 지난 시간은 뒤로
      const aMinutes = a[1].nextDeparture.nextDepartureMinutes;
      const bMinutes = b[1].nextDeparture.nextDepartureMinutes;

      if (aMinutes === -1 && bMinutes !== -1) return 1;
      if (aMinutes !== -1 && bMinutes === -1) return -1;

      // 둘 다 지났거나 둘 다 안 지난 경우 시간순
      return aMinutes - bMinutes;
    })
    .map(([routeNumber, data]) => ({
      routeNumber,
      departureTime: data.nextDeparture.departureTime,
      nextDepartureMinutes: data.nextDeparture.nextDepartureMinutes,
      category: data.nextDeparture.category,
      isFromTerminal: data.nextDeparture.isFromTerminal,
      remainingCount: data.remainingCount,
      operatesToday: data.operatesToday,
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
    <div className="container mx-auto p-4">
      <StopDetailHeader stopName={stopName} />

      <StopDetailTabs
        activeTab={activeTab}
        departureRoutesCount={departureRoutes.length}
        arrivalRoutesCount={arrivalRoutes.length}
        onTabChange={setActiveTab}
      />

      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">다음 출발 시간</h2>
          <BusDepartureTable
            departures={filteredDepartures}
            isLoading={isLoading}
            error={error}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-3">노선 목록</h2>
          <RoutesList routes={routeListData} />
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/stops" className="text-blue-500 hover:underline mr-4">
          종점 목록으로 돌아가기
        </Link>
        <Link href="/" className="text-blue-500 hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
