"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { loadBusData } from "@/entities/bus/api/loadBusData";
import { BusData, DayType } from "@/entities/bus/model/types";
import { Clock } from "@/shared/ui/Clock";

export default function BusDetailPage() {
  const params = useParams<{ routeNumber: string }>();
  const routeNumber = params?.routeNumber
    ? decodeURIComponent(params.routeNumber)
    : "";

  const [busData, setBusData] = useState<BusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DayType>("평일");
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1분마다 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchBusData() {
      try {
        console.log(`노선 ${routeNumber} 데이터 로딩 시작...`);
        setIsLoading(true);
        const data = await loadBusData(routeNumber);
        console.log("로드된 버스 데이터:", data);

        if (data) {
          setBusData(data);

          // 노선 데이터의 운행 정보에서 사용 가능한 첫 번째 카테고리로 탭 설정
          if (data.operationInfo && data.operationInfo.length > 0) {
            const categories = new Set(
              data.operationInfo.map((op) => op.category)
            );
            if (categories.has("평일")) {
              setActiveTab("평일");
            } else if (categories.has("토요일")) {
              setActiveTab("토요일");
            } else if (categories.has("일요일")) {
              setActiveTab("일요일");
            } else if (categories.has("공통")) {
              setActiveTab("공통");
            }
          }
        } else {
          setError(`${routeNumber}번 노선 데이터를 찾을 수 없습니다.`);
        }
      } catch (err) {
        console.error(`노선 ${routeNumber} 데이터 로딩 중 오류 발생:`, err);
        setError("버스 노선 데이터를 로드하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
        console.log(`노선 ${routeNumber} 데이터 로딩 완료`);
      }
    }

    if (routeNumber) {
      fetchBusData();
    }
  }, [routeNumber]);

  // 선택된 날짜에 맞는 운행 정보 필터링
  const filteredOperations =
    busData?.operationInfo.filter(
      (op) =>
        op.category === activeTab ||
        (activeTab === "평일" && op.category === "공통")
    ) || [];

  // 가능한 Day Type 목록 생성
  const availableTabs: DayType[] = ["평일", "토요일", "일요일", "공통"].filter(
    (tab) => {
      if (tab === "공통") return true; // 공통 탭은 항상 표시
      return busData?.operationInfo.some((op) => op.category === tab);
    }
  ) as DayType[];

  // 현재 시간 기준으로 출발 시간 분류
  function getTimeStatus(timeStr: string): "past" | "current" | "future" {
    if (timeStr === "-") return "future";

    const [hours, minutes] = timeStr.split(":").map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0);

    const now = new Date();

    // 30분 이내면 current
    if (Math.abs(timeDate.getTime() - now.getTime()) <= 30 * 60 * 1000) {
      return "current";
    }

    return timeDate < now ? "past" : "future";
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{routeNumber}번 버스</h1>
        <Clock />
        <div className="text-sm text-gray-500 mt-2">
          현재 시간: {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center my-4">{error}</div>
      ) : busData ? (
        <div>
          <div className="bg-white shadow-md rounded-lg p-4 mb-6">
            <h2 className="text-xl font-bold mb-3">노선 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">출발 종점</p>
                <p>{busData.routeInfo.origin}</p>
              </div>
              <div>
                <p className="font-semibold">도착 종점</p>
                <p>{busData.routeInfo.destination}</p>
              </div>
              <div>
                <p className="font-semibold">첫차</p>
                <p>{busData.routeInfo.firstBusTime}</p>
              </div>
              <div>
                <p className="font-semibold">막차</p>
                <p>{busData.routeInfo.lastBusTime}</p>
              </div>
              <div>
                <p className="font-semibold">운행 횟수</p>
                <p>{busData.routeInfo.operationCount}</p>
              </div>
              <div>
                <p className="font-semibold">배차 간격</p>
                <p>{busData.routeInfo.interval}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex mb-4 space-x-2 overflow-x-auto">
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === tab
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <h2 className="text-xl font-bold mb-3">
              운행 시간표 ({activeTab})
            </h2>

            {filteredOperations.length === 0 ? (
              <p className="text-center text-gray-500 my-4">
                이 날짜에는 운행 정보가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">회차</th>
                      <th className="p-2 border">출발지</th>
                      <th className="p-2 border">출발 시간</th>
                      <th className="p-2 border">도착지</th>
                      <th className="p-2 border">도착 시간</th>
                      <th className="p-2 border">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOperations.map((op, index) => {
                      const departureStatus = getTimeStatus(op.departureTime);
                      const arrivalStatus = getTimeStatus(op.arrivalTime);

                      return (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }
                        >
                          <td className="p-2 border text-center">
                            {op.operationNumber}
                          </td>
                          <td className="p-2 border">
                            {op.departureName !== "-" ? (
                              <Link
                                href={`/stops/${encodeURIComponent(
                                  op.departureName
                                )}`}
                                className="text-blue-500 hover:underline"
                              >
                                {op.departureName}
                              </Link>
                            ) : (
                              ""
                            )}
                          </td>
                          <td
                            className={`p-2 border text-center ${
                              departureStatus === "current"
                                ? "bg-green-100 font-bold"
                                : departureStatus === "past"
                                ? "text-gray-400"
                                : ""
                            }`}
                          >
                            {op.departureTime !== "-" ? op.departureTime : ""}
                          </td>
                          <td className="p-2 border">
                            {op.arrivalName !== "-" ? (
                              <Link
                                href={`/stops/${encodeURIComponent(
                                  op.arrivalName
                                )}`}
                                className="text-blue-500 hover:underline"
                              >
                                {op.arrivalName}
                              </Link>
                            ) : (
                              ""
                            )}
                          </td>
                          <td
                            className={`p-2 border text-center ${
                              arrivalStatus === "current"
                                ? "bg-green-100 font-bold"
                                : arrivalStatus === "past"
                                ? "text-gray-400"
                                : ""
                            }`}
                          >
                            {op.arrivalTime !== "-" ? op.arrivalTime : ""}
                          </td>
                          <td className="p-2 border">{op.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-center space-x-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 mr-1"></div>
                <span>현재 시간대 (±30분)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-white border border-gray-300 mr-1"></div>
                <span>예정</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 text-gray-400 mr-1">A</div>
                <span>지난 시간</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 text-center">
        <Link href="/buses" className="text-blue-500 hover:underline mr-4">
          노선 목록으로 돌아가기
        </Link>
        <Link href="/" className="text-blue-500 hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
