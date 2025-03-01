"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { loadRoutesByTerminal } from "@/entities/bus/api/loadBusData";

interface TerminalCardProps {
  name: string;
}

export function TerminalCard({ name }: TerminalCardProps) {
  const [routeCount, setRouteCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRouteCount() {
      try {
        setIsLoading(true);
        const routes = await loadRoutesByTerminal(name);
        setRouteCount(routes.length);
      } catch (error) {
        console.error(`${name} 종점의 노선 정보 로드 오류:`, error);
        setRouteCount(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRouteCount();
  }, [name]);

  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-gray-600 text-sm mt-1">
            {isLoading
              ? "노선 정보 로딩 중..."
              : routeCount === null
              ? "노선 정보 없음"
              : `총 노선 수: ${routeCount}개`}
          </p>
        </div>
        <Link
          href={`/terminals/${encodeURIComponent(name)}`}
          className="btn btn-primary text-sm py-1 px-3"
        >
          보기
        </Link>
      </div>
    </div>
  );
}
