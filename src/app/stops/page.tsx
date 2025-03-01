"use client";

import { useEffect, useState } from "react";

import { loadTerminals } from "@/entities/bus/api/loadBusData";
import { Clock } from "@/shared/ui/Clock";
import { TerminalCard } from "@/widgets/terminals/TerminalCard";

export default function StopsPage() {
  const [stops, setStops] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchStops() {
      try {
        setIsLoading(true);
        console.log("종점 목록 불러오기 시작");
        const data = await loadTerminals();
        console.log(`종점 목록 ${data.length}개 로드 완료`);
        setStops(data);
        setError(null);
      } catch (err) {
        console.error("종점 목록 로드 오류:", err);
        setError("종점 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStops();
  }, []);

  const filteredStops = stops.filter((stop) =>
    stop.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-bold mb-2">원주 버스 종점</h1>
        <Clock />
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="종점 이름 검색..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="mt-2">종점 목록을 불러오는 중...</div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">
          <p>{error}</p>
          <button
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div>
          {filteredStops.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredStops.map((stop) => (
                <TerminalCard key={stop} name={stop} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <a href="/" className="text-blue-500 hover:underline">
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}
