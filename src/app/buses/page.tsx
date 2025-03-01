"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { loadAllBusData } from "@/entities/bus/api/loadBusData";
import { BusData } from "@/entities/bus/model/types";
import { Clock } from "@/shared/ui/Clock";

export default function BusListPage() {
  const [routes, setRoutes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [animateCards, setAnimateCards] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

          // 데이터 로딩 완료 후 애니메이션 활성화
          setTimeout(() => {
            setAnimateCards(true);
          }, 100);
        } else {
          setError("노선 데이터를 찾을 수 없습니다.");
        }
      } catch (err) {
        console.error("노선 데이터 로딩 중 오류 발생:", err);
        setError("노선 데이터를 로드하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
        console.log("노선 목록 로딩 완료");

        // 데이터 로딩 완료 후 검색 입력 필드에 포커스
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    }

    loadRoutes();
  }, []);

  const filteredRoutes = routes.filter((route) =>
    route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-bold mb-2">원주 버스 노선</h1>
        <Clock />
      </div>

      <div className="mb-6 max-w-lg mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="노선 번호 검색..."
            className="w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="text-center text-sm text-gray-500 mt-2">
          총 {routes.length}개 노선 중 {filteredRoutes.length}개 노선이
          검색되었습니다.
        </div>
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
            <div className="text-center my-8 bg-gray-50 p-6 rounded-lg shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg text-gray-500 mb-2">
                검색 결과가 없습니다.
              </p>
              <p className="text-sm text-gray-400">
                다른 노선 번호로 검색해보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredRoutes.map((route, index) => (
                <Link
                  key={route}
                  href={`/buses/${route}`}
                  className={`bg-white rounded-lg p-4 transform transition-all duration-300 shadow-md hover:shadow-lg hover:bg-blue-50 hover:scale-105 flex flex-col justify-between items-center relative overflow-hidden ${
                    animateCards
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${(index % 20) * 30}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

                  <div className="rounded-full bg-blue-100 flex items-center justify-center mb-2 p-2">
                    <span className="text-lg font-bold text-blue-600 text-center break-words">
                      {route}
                    </span>
                  </div>

                  <div className="text-center z-10">
                    <div className="text-xl font-bold mb-1">{route}번</div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium inline-block">
                      상세 정보
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-0 origin-left transition-transform group-hover:scale-x-100"></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-blue-500 hover:underline flex items-center justify-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
