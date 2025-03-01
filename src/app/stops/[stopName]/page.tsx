"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
    getAllDepartureTimesFromStop, loadBusData, loadRoutesByTerminal, loadRoutesToTerminal
} from "@/entities/bus/api/loadBusData";
import { Clock } from "@/shared/ui/Clock";

// 대기 시간 표시 컴포넌트
function WaitingTime({ minutes }: { minutes: number }) {
  if (minutes === -1) {
    return <span className="text-gray-400">출발 완료</span>;
  }

  if (minutes === 0) {
    return <span className="text-red-500 font-bold">곧 출발</span>;
  }

  if (minutes < 5) {
    return <span className="text-red-500 font-bold">{minutes}분 후</span>;
  }

  if (minutes < 10) {
    return <span className="text-orange-500 font-bold">{minutes}분 후</span>;
  }

  return <span className="text-blue-500">{minutes}분 후</span>;
}

export default function StopDetailPage() {
  const params = useParams<{ stopName: string }>();
  const stopName = params?.stopName ? decodeURIComponent(params.stopName) : "";

  const [departureRoutes, setDepartureRoutes] = useState<string[]>([]);
  const [arrivalRoutes, setArrivalRoutes] = useState<string[]>([]);
  const [departureTimes, setDepartureTimes] = useState<
    Array<{
      routeNumber: string;
      departureTime: string;
      nextDepartureMinutes: number;
      category: string;
      isFromTerminal: boolean;
    }>
  >([]);
  const [groupedDepartures, setGroupedDepartures] = useState<
    Record<
      string,
      {
        nextDeparture: {
          routeNumber: string;
          departureTime: string;
          nextDepartureMinutes: number;
          category: string;
          isFromTerminal: boolean;
        };
        remainingCount: number;
      }
    >
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "from" | "to">("all");
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1분마다 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      // 시간표 다시 로드
      loadDepartureTimes();
    }, 60000);
    return () => clearInterval(interval);
  }, [stopName]);

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
      const grouped: Record<
        string,
        {
          nextDeparture: (typeof times)[0];
          remainingCount: number;
        }
      > = {};

      // 현재 시간
      const now = new Date();
      const today = now.toDateString();

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

        // 오늘 남은 출발 횟수 계산
        // 현재 요일 확인
        const dayOfWeek = now.getDay(); // 0: 일요일, 1-5: 평일, 6: 토요일
        let dayType = "평일";
        if (dayOfWeek === 0) dayType = "일요일";
        else if (dayOfWeek === 6) dayType = "토요일";

        // 오늘 해당하는 카테고리의 운행 정보만 필터링
        const todayOperations = busData.operationInfo.filter(
          (op) =>
            (op.category === dayType || op.category === "공통") &&
            (op.departureName === stopName || op.arrivalName === stopName)
        );

        // 아직 출발하지 않은 운행 개수
        let remainingCount = 0;

        for (const op of todayOperations) {
          let timeStr = "";
          if (op.departureName === stopName) {
            timeStr = op.departureTime;
          } else if (op.arrivalName === stopName) {
            timeStr = op.arrivalTime;
          }

          if (timeStr === "-") continue;

          const [hours, minutes] = timeStr.split(":").map(Number);
          const opTime = new Date();
          opTime.setHours(hours, minutes, 0);

          if (opTime > now) {
            remainingCount++;
          }
        }

        // 결과 저장
        grouped[routeNumber] = {
          nextDeparture,
          remainingCount,
        };
      }

      setGroupedDepartures(grouped);
    } catch (err) {
      console.error(`${stopName} 출발 시간표 로딩 중 오류:`, err);
    }
  }

  // 필터링된 그룹화 출발 시간표
  const filteredGroupedDepartures = Object.entries(groupedDepartures)
    .filter(([_, data]) => {
      if (activeTab === "all") return true;
      if (activeTab === "from") return data.nextDeparture.isFromTerminal;
      if (activeTab === "to") return !data.nextDeparture.isFromTerminal;
      return true;
    })
    .sort((a, b) => {
      // 이미 지난 시간은 뒤로
      const aMinutes = a[1].nextDeparture.nextDepartureMinutes;
      const bMinutes = b[1].nextDeparture.nextDepartureMinutes;

      if (aMinutes === -1 && bMinutes !== -1) return 1;
      if (aMinutes !== -1 && bMinutes === -1) return -1;

      // 둘 다 지났거나 둘 다 안 지난 경우 시간순
      return aMinutes - bMinutes;
    });

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{stopName}</h1>
        <p className="text-gray-600">버스 시간표</p>
        <Clock />
        <div className="text-sm text-gray-500 mt-2">
          현재 시간: {currentTime.toLocaleTimeString()}
        </div>
      </div>

      <div className="flex mb-4 space-x-2 overflow-x-auto">
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("all")}
        >
          전체 시간표
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === "from"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("from")}
        >
          출발 노선 ({departureRoutes.length}개)
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === "to"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("to")}
        >
          도착 노선 ({arrivalRoutes.length}개)
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center my-4">{error}</div>
      ) : (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">다음 출발 시간</h2>
            {filteredGroupedDepartures.length === 0 ? (
              <div className="text-center my-4 text-gray-500">
                {activeTab === "all"
                  ? "이 종점의 시간표 정보가 없습니다."
                  : activeTab === "from"
                  ? "이 종점에서 출발하는 노선이 없습니다."
                  : "이 종점에 도착하는 노선이 없습니다."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">노선</th>
                      <th className="p-2 border">구분</th>
                      <th className="p-2 border">다음 출발</th>
                      <th className="p-2 border">대기 시간</th>
                      <th className="p-2 border">유형</th>
                      <th className="p-2 border">오늘 남은 운행</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroupedDepartures.map(([routeNumber, data]) => (
                      <tr
                        key={routeNumber}
                        className={
                          data.nextDeparture.nextDepartureMinutes >= 0
                            ? "bg-white"
                            : "bg-gray-100"
                        }
                      >
                        <td className="p-2 border text-center">
                          <Link
                            href={`/buses/${encodeURIComponent(routeNumber)}`}
                            className="text-blue-500 hover:underline"
                          >
                            {routeNumber}번
                          </Link>
                        </td>
                        <td className="p-2 border text-center">
                          {data.nextDeparture.isFromTerminal
                            ? "출발"
                            : "도착/회차"}
                        </td>
                        <td className="p-2 border text-center">
                          {data.nextDeparture.departureTime}
                        </td>
                        <td className="p-2 border text-center">
                          <WaitingTime
                            minutes={data.nextDeparture.nextDepartureMinutes}
                          />
                        </td>
                        <td className="p-2 border text-center">
                          {data.nextDeparture.category}
                        </td>
                        <td className="p-2 border text-center font-bold">
                          {data.remainingCount > 0
                            ? `${data.remainingCount}회`
                            : "운행 종료"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">노선 목록</h2>
            {departureRoutes.length === 0 && arrivalRoutes.length === 0 ? (
              <div className="text-center my-4 text-gray-500">
                이 종점을 지나는 노선이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from(
                  new Set([...departureRoutes, ...arrivalRoutes])
                ).map((route) => {
                  const routeData = groupedDepartures[route];
                  return (
                    <Link
                      key={route}
                      href={`/buses/${encodeURIComponent(route)}`}
                      className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="text-center">
                        <div className="text-xl font-bold mb-1">{route}번</div>
                        <div className="flex justify-center space-x-2 mb-2">
                          {departureRoutes.includes(route) && (
                            <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded">
                              출발
                            </span>
                          )}
                          {arrivalRoutes.includes(route) && (
                            <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded">
                              도착
                            </span>
                          )}
                        </div>
                        {routeData && (
                          <div className="text-sm font-semibold">
                            {routeData.remainingCount > 0
                              ? `오늘 남은 운행: ${routeData.remainingCount}회`
                              : "오늘 운행 종료"}
                          </div>
                        )}
                        <div className="text-sm text-blue-500 mt-1">
                          상세 정보 보기
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
