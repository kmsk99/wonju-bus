import Link from "next/link";

import { useDayTypeStore } from "@/entities/bus/model/dayTypeState";

interface RouteInfo {
  routeNumber: string;
  isDeparture: boolean;
  isArrival: boolean;
  remainingCount: number;
  operatesToday: boolean;
}

interface RoutesListProps {
  routes: RouteInfo[];
}

/**
 * 노선 목록 위젯 컴포넌트
 */
export function RoutesList({ routes }: RoutesListProps) {
  const { dayTypeText } = useDayTypeStore();

  if (routes.length === 0) {
    return (
      <div className="text-center my-4 text-gray-500">
        이 종점을 지나는 노선이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {routes.map((route) => (
        <Link
          key={route.routeNumber}
          href={`/buses/${encodeURIComponent(route.routeNumber)}`}
          className={`shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow ${
            !route.operatesToday ? "bg-gray-100" : "bg-white"
          }`}
        >
          <div className="text-center">
            <div
              className={`text-xl font-bold mb-1 ${
                !route.operatesToday ? "text-gray-500" : ""
              }`}
            >
              {route.routeNumber}번
              {!route.operatesToday && (
                <div className="text-xs mt-1">({dayTypeText} 미운행)</div>
              )}
            </div>
            <div className="flex justify-center space-x-2 mb-2">
              {route.isDeparture && (
                <span
                  className={`text-xs py-1 px-2 rounded ${
                    !route.operatesToday
                      ? "bg-gray-200 text-gray-600"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  출발
                </span>
              )}
              {route.isArrival && (
                <span
                  className={`text-xs py-1 px-2 rounded ${
                    !route.operatesToday
                      ? "bg-gray-200 text-gray-600"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  도착
                </span>
              )}
            </div>
            <div
              className={`text-sm font-semibold ${
                !route.operatesToday ? "text-gray-500" : ""
              }`}
            >
              {!route.operatesToday
                ? "오늘 운행하지 않음"
                : route.remainingCount > 0
                ? `오늘 남은 운행: ${route.remainingCount}회`
                : "오늘 운행 종료"}
            </div>
            <div
              className={`text-sm mt-1 ${
                !route.operatesToday ? "text-gray-500" : "text-blue-500"
              }`}
            >
              상세 정보 보기
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
