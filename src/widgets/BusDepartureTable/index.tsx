import Link from "next/link";

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

  // 오늘 운행하는 노선은 상단에, 운행하지 않는 노선은 하단에 정렬
  const sortedDepartures = [...departures].sort((a, b) => {
    // 1. 운행 여부에 따른 1차 분류 (운행하는 노선이 먼저 오도록)
    if (a.operatesToday !== b.operatesToday) {
      return a.operatesToday ? -1 : 1;
    }

    // 2. 운행하는 노선 중에서 추가 분류
    if (a.operatesToday) {
      // 2.1 운행 중인지, 운행 종료인지 확인
      const aIsActive =
        (a.nextDepartureMinutes !== undefined && a.nextDepartureMinutes >= 0) ||
        (a.remainingCount !== undefined && a.remainingCount > 0);
      const bIsActive =
        (b.nextDepartureMinutes !== undefined && b.nextDepartureMinutes >= 0) ||
        (b.remainingCount !== undefined && b.remainingCount > 0);

      // 운행 중인 노선이 먼저 오도록
      if (aIsActive !== bIsActive) {
        return aIsActive ? -1 : 1;
      }

      // 2.2 둘 다 운행 중이면 출발 대기 시간순으로 정렬
      if (
        aIsActive &&
        a.nextDepartureMinutes !== undefined &&
        b.nextDepartureMinutes !== undefined
      ) {
        return a.nextDepartureMinutes - b.nextDepartureMinutes;
      }
    }

    // 3. 같은 카테고리 내에서는 출발 시간으로 정렬
    return a.departureTime.localeCompare(b.departureTime);
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
          className={`rounded-lg border p-3 shadow-sm ${
            bus.operatesToday ? "bg-white" : "bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link
                href={`/buses/${bus.routeNumber}`}
                className={`text-lg font-medium ${
                  bus.operatesToday
                    ? "text-blue-600 hover:text-blue-800"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {bus.routeNumber}번
              </Link>
              <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                {bus.isFromTerminal ? "기점" : "경유"}
              </span>
              {bus.category && (
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {bus.category}
                </span>
              )}
            </div>

            {bus.operatesToday && bus.remainingCount !== undefined && (
              <span
                className={`rounded px-2 py-1 text-xs ${
                  bus.remainingCount > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
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
