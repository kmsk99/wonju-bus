"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { loadRoutesByTerminal } from "@/entities/bus/api/loadBusData";
import { Clock } from "@/shared/ui/Clock";

export default function StopDetailPage() {
  const params = useParams<{ stopName: string }>();
  const stopName = params?.stopName ? decodeURIComponent(params.stopName) : "";

  const [routes, setRoutes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoutesForStop() {
      try {
        console.log(`${stopName} 종점의 노선 목록 로딩 시작...`);
        setIsLoading(true);
        const routeNumbers = await loadRoutesByTerminal(stopName);
        console.log(`로드된 노선 목록: ${routeNumbers.length}개`);
        setRoutes(routeNumbers);
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{stopName}</h1>
        <p className="text-gray-600">출발 노선 목록</p>
        <Clock />
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center my-4">{error}</div>
      ) : (
        <div>
          {routes.length === 0 ? (
            <div className="text-center my-4 text-gray-500">
              이 종점에서 출발하는 노선이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {routes.map((route) => (
                <Link
                  key={route}
                  href={`/buses/${route}`}
                  className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="text-center">
                    <div className="text-xl font-bold mb-1">{route}번</div>
                    <div className="text-sm text-blue-500">상세 정보 보기</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
