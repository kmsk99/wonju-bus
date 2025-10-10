import Link from "next/link";

import { useDayTypeStore } from "@/entities/bus/model/dayTypeState";

export interface RouteInfo {
  routeNumber: string;
  isDeparture?: boolean;
  isArrival?: boolean;
  remainingCount?: number;
  operatesToday?: boolean;
}

export interface RoutesListProps {
  routes: RouteInfo[];
}

/**
 * 노선 목록 위젯 컴포넌트
 */
export function RoutesList({ routes }: RoutesListProps) {
  const { dayTypeText } = useDayTypeStore();

  // 현재 날짜에 운행하는 노선과 아닌 노선 분리
  const sortedRoutes = [...routes].sort((a, b) => {
    // 1. 운행 여부에 따른 1차 분류 (운행하는 노선이 먼저 오도록)
    if (a.operatesToday !== b.operatesToday) {
      return a.operatesToday ? -1 : 1;
    }

    // 2. 운행하는 노선 중에서 추가 분류
    if (a.operatesToday) {
      // 2.1 운행 중인지, 운행 종료인지 확인 (남은 운행 횟수로 판단)
      const aIsActive = a.remainingCount !== undefined && a.remainingCount > 0;
      const bIsActive = b.remainingCount !== undefined && b.remainingCount > 0;

      // 운행 중인 노선이 먼저 오도록
      if (aIsActive !== bIsActive) {
        return aIsActive ? -1 : 1;
      }
    }

    // 3. 노선 번호로 마지막 정렬
    return a.routeNumber.localeCompare(b.routeNumber);
  });

  if (routes.length === 0) {
    return (
      <div className="text-center my-4 text-gray-500">
        이 종점을 지나는 노선이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
      {sortedRoutes.map((route) => (
        <Link
          key={route.routeNumber}
          href={`/buses/${route.routeNumber}`}
          className={`relative rounded-lg border p-3 hover:border-blue-500 ${
            route.operatesToday
              ? "border-gray-200"
              : "border-gray-100 opacity-70"
          }`}
        >
          <div className="flex flex-col">
            <span
              className={`text-lg font-bold ${
                route.operatesToday ? "text-black" : "text-gray-500"
              }`}
            >
              {route.routeNumber}번
            </span>
            <div className="mt-1 flex gap-1 text-sm">
              {route.isDeparture && (
                <span className="rounded bg-blue-100 px-1 py-0.5 text-blue-700">
                  출발
                </span>
              )}
              {route.isArrival && (
                <span className="rounded bg-purple-100 px-1 py-0.5 text-purple-700">
                  도착
                </span>
              )}
              {!route.operatesToday && (
                <span className="rounded bg-gray-100 px-1 py-0.5 text-gray-700">
                  오늘 미운행
                </span>
              )}
            </div>
            {route.operatesToday && route.remainingCount !== undefined && (
              <div className="mt-1 text-sm text-gray-500">
                오늘 남은 운행: {route.remainingCount}회
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
