"use client";

import Link from "next/link";
import { useRef } from "react";

import { useDayTypeStore } from "@/entities/bus/model/dayTypeState";
import { WaitingTime } from "@/shared/ui/WaitingTime";

export interface BusDepartureInfo {
  routeNumber: string;
  departureTime: string;
  nextDepartureMinutes?: number;
  category?: string;
  isFromTerminal?: boolean;
  remainingCount?: number;
  operatesToday?: boolean;
  isNextDay?: boolean;
  tripIndex?: number;
}

export interface BusDepartureTableProps {
  departures: BusDepartureInfo[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * 버스 출발 시간표 컴포넌트
 */
export function BusDepartureTable({
  departures,
  isLoading = false,
  error,
}: BusDepartureTableProps) {
  const { dayTypeText } = useDayTypeStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // 시간을 분으로 변환하는 유틸리티 함수
  const getTimeMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // 현재 시간을 분으로 계산
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 시간표 정렬 (운행 예정/운행 완료 기준)
  const sortedDepartures = [...departures].sort((a, b) => {
    // 1. 운행일 기준 정렬 (운행하는 날이 먼저 오도록)
    if (a.operatesToday !== b.operatesToday) {
      return a.operatesToday ? -1 : 1;
    }

    // 2. 시간 기준으로 항상 오름차순 정렬
    const timeA = getTimeMinutes(a.departureTime);
    const timeB = getTimeMinutes(b.departureTime);
    return timeA - timeB;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return <div className="py-3 text-center text-red-500">{error}</div>;
  }

  if (departures.length === 0) {
    return (
      <div className="py-3 text-center text-gray-500">
        시간표 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedDepartures.map((bus, index) => (
        <div
          key={`${bus.routeNumber}-${bus.departureTime}-${index}`}
          className={`rounded-lg border p-3 shadow-sm hover:shadow-md ${
            bus.operatesToday
              ? "bg-white hover:bg-blue-50"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link
                href={`/buses/${bus.routeNumber}`}
                className={`text-lg font-medium transition-colors duration-300 ${
                  bus.operatesToday
                    ? "text-blue-600 hover:text-blue-800"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {bus.routeNumber}번
              </Link>
              {bus.tripIndex && (
                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 font-medium">
                  회차 {bus.tripIndex}
                </span>
              )}
              <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors duration-300 hover:bg-gray-200">
                {bus.isFromTerminal ? "기점" : "경유"}
              </span>
              {bus.category && (
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors duration-300 hover:bg-gray-200">
                  {bus.category}
                </span>
              )}
            </div>

            {bus.operatesToday && bus.remainingCount !== undefined && (
              <span
                className={`rounded px-2 py-1 text-xs transition-all duration-300 ${
                  bus.remainingCount > 0
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {bus.remainingCount > 0
                  ? `${bus.remainingCount}회`
                  : "운행 종료"}
              </span>
            )}
          </div>

          {!bus.operatesToday && (
            <div className="mt-1 text-xs text-gray-500">
              ({dayTypeText} 미운행)
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium">출발:</span>
              <span
                className={`text-sm ${
                  bus.operatesToday ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {bus.departureTime}
                {bus.isNextDay && (
                  <span className="ml-1 text-xs text-blue-600 font-medium">
                    (내일)
                  </span>
                )}
              </span>
            </div>

            <div className="mt-1">
              <span className="text-sm font-medium">대기 시간:</span>{" "}
              {bus.isNextDay ? (
                <span className="text-gray-500">운행 종료</span>
              ) : bus.nextDepartureMinutes !== undefined ? (
                <WaitingTime minutes={bus.nextDepartureMinutes} />
              ) : (
                <span className="text-gray-500">-</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
