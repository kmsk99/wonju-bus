"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
    getAllDepartureTimesFromStop, loadRoutesByTerminal, loadRoutesToTerminal
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
    } catch (err) {
      console.error(`${stopName} 출발 시간표 로딩 중 오류:`, err);
    }
  }

  // 필터링된 출발 시간표
  const filteredDepartureTimes = departureTimes.filter((time) => {
    if (activeTab === "all") return true;
    if (activeTab === "from") return time.isFromTerminal;
    if (activeTab === "to") return !time.isFromTerminal;
    return true;
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
            <h2 className="text-xl font-bold mb-3">시간표</h2>
            {filteredDepartureTimes.length === 0 ? (
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
                      <th className="p-2 border">시간</th>
                      <th className="p-2 border">대기 시간</th>
                      <th className="p-2 border">유형</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartureTimes.map((time, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="p-2 border text-center">
                          <Link
                            href={`/buses/${time.routeNumber}`}
                            className="text-blue-500 hover:underline"
                          >
                            {time.routeNumber}번
                          </Link>
                        </td>
                        <td className="p-2 border text-center">
                          {time.isFromTerminal ? "출발" : "도착/회차"}
                        </td>
                        <td className="p-2 border text-center">
                          {time.departureTime}
                        </td>
                        <td className="p-2 border text-center">
                          <WaitingTime minutes={time.nextDepartureMinutes} />
                        </td>
                        <td className="p-2 border text-center">
                          {time.category}
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
                ).map((route) => (
                  <Link
                    key={route}
                    href={`/buses/${route}`}
                    className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="text-center">
                      <div className="text-xl font-bold mb-1">{route}번</div>
                      <div className="flex justify-center space-x-2">
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
                      <div className="text-sm text-blue-500 mt-1">
                        상세 정보 보기
                      </div>
                    </div>
                  </Link>
                ))}
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
