import Link from "next/link";

import { useDayTypeStore } from "@/entities/bus/model/dayTypeState";
import { WaitingTime } from "@/shared/ui/WaitingTime";

interface BusDepartureInfo {
  routeNumber: string;
  departureTime: string;
  nextDepartureMinutes: number;
  category: string;
  isFromTerminal: boolean;
  remainingCount: number;
  operatesToday: boolean;
}

interface BusDepartureTableProps {
  departures: BusDepartureInfo[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 버스 출발 시간표 컴포넌트
 */
export function BusDepartureTable({
  departures,
  isLoading,
  error,
}: BusDepartureTableProps) {
  const { dayTypeText } = useDayTypeStore();

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center my-4">{error}</div>;
  }

  if (departures.length === 0) {
    return (
      <div className="text-center my-4 text-gray-500">
        표시할 시간표 정보가 없습니다.
      </div>
    );
  }

  return (
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
          {departures.map((departure) => (
            <tr
              key={`${departure.routeNumber}-${departure.departureTime}`}
              className={
                !departure.operatesToday
                  ? "bg-gray-100 text-gray-500"
                  : departure.nextDepartureMinutes >= 0
                  ? "bg-white"
                  : "bg-gray-100"
              }
            >
              <td className="p-2 border text-center">
                <Link
                  href={`/buses/${encodeURIComponent(departure.routeNumber)}`}
                  className={`hover:underline ${
                    !departure.operatesToday ? "text-gray-500" : "text-blue-500"
                  }`}
                >
                  {departure.routeNumber}번
                  {!departure.operatesToday && (
                    <span className="block text-xs mt-1">
                      ({dayTypeText} 미운행)
                    </span>
                  )}
                </Link>
              </td>
              <td className="p-2 border text-center">
                {departure.isFromTerminal ? "출발" : "도착/회차"}
              </td>
              <td className="p-2 border text-center">
                {departure.departureTime}
              </td>
              <td className="p-2 border text-center">
                <WaitingTime minutes={departure.nextDepartureMinutes} />
              </td>
              <td className="p-2 border text-center">{departure.category}</td>
              <td className="p-2 border text-center font-bold">
                {!departure.operatesToday ? (
                  <span className="text-gray-500">운행일 아님</span>
                ) : departure.remainingCount > 0 ? (
                  `${departure.remainingCount}회`
                ) : (
                  "운행 종료"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
