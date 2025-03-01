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
    // 운행 여부에 따라 정렬 (운행하는 노선이 먼저 오도록)
    if (a.operatesToday !== b.operatesToday) {
      return a.operatesToday ? -1 : 1;
    }

    // 다음 출발까지 남은 시간으로 이차 정렬
    if (
      a.nextDepartureMinutes !== undefined &&
      b.nextDepartureMinutes !== undefined
    ) {
      return a.nextDepartureMinutes - b.nextDepartureMinutes;
    }

    // 출발 시간으로 삼차 정렬
    return a.departureTime.localeCompare(b.departureTime);
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return <div className="py-4 text-center text-red-500">{error}</div>;
  }

  if (departures.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        시간표 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              노선번호
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              종류
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              다음 출발
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              대기 시간
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              구분
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              남은 운행
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedDepartures.map((bus, index) => (
            <tr
              key={`${bus.routeNumber}-${bus.departureTime}-${index}`}
              className={bus.operatesToday ? "" : "bg-gray-50"}
            >
              <td className="whitespace-nowrap px-6 py-4">
                <Link
                  href={`/buses/${bus.routeNumber}`}
                  className={`font-medium ${
                    bus.operatesToday
                      ? "text-blue-600 hover:text-blue-800"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {bus.routeNumber}번
                </Link>
                {!bus.operatesToday && (
                  <div className="mt-1 text-xs text-gray-500">
                    ({dayTypeText} 미운행)
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {bus.isFromTerminal ? "기점" : "경유"}
              </td>
              <td
                className={`whitespace-nowrap px-6 py-4 text-sm ${
                  bus.operatesToday ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {bus.departureTime}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                {bus.operatesToday && bus.nextDepartureMinutes !== undefined ? (
                  <WaitingTime minutes={bus.nextDepartureMinutes} />
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {bus.category || "-"}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                {bus.operatesToday && bus.remainingCount !== undefined ? (
                  <span
                    className={`${
                      bus.remainingCount > 0
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {bus.remainingCount > 0
                      ? `${bus.remainingCount}회`
                      : "운행 종료"}
                  </span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
