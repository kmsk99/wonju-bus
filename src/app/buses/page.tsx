"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { loadAllBusData } from "@/entities/bus/api/loadBusData";
import { BusData } from "@/entities/bus/model/types";
import { Clock } from "@/shared/ui/Clock";

export default function BusListPage() {
  const [routes, setRoutes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadRoutes() {
      try {
        console.log("노선 목록 로딩 시작...");
        setIsLoading(true);
        const busDataList = await loadAllBusData();
        console.log(`로드된 데이터: ${busDataList.length}개 항목`);

        if (busDataList && busDataList.length > 0) {
          const routeNumbers = busDataList.map(
            (bus: BusData) => bus.routeInfo.routeNumber
          );
          setRoutes(routeNumbers);
          console.log("로드된 노선 목록:", routeNumbers);
        } else {
          setError("노선 데이터를 찾을 수 없습니다.");
        }
      } catch (err) {
        console.error("노선 데이터 로딩 중 오류 발생:", err);
        setError("노선 데이터를 로드하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
        console.log("노선 목록 로딩 완료");
      }
    }

    loadRoutes();
  }, []);

  const filteredRoutes = routes.filter((route) =>
    route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-bold mb-2">원주 버스 노선</h1>
        <Clock />
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="노선 번호 검색..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center my-4">{error}</div>
      ) : (
        <div>
          {filteredRoutes.length === 0 ? (
            <div className="text-center my-4 text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredRoutes.map((route) => (
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
        <Link href="/" className="text-blue-500 hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
