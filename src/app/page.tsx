"use client";

import Link from "next/link";

import { Clock } from "@/shared/ui/Clock";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
        <div className="w-full text-center">
          <h1 className="text-4xl font-bold mb-4">원주 버스 시간표</h1>
          <Clock />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <Link
              href="/stops"
              className="group rounded-lg border border-transparent px-5 py-8 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            >
              <h2 className="mb-3 text-2xl font-semibold">
                종점별 조회
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ml-1">
                  →
                </span>
              </h2>
              <p className="text-left">
                출발지 종점별로 버스 노선을 조회합니다.
              </p>
            </Link>

            <Link
              href="/buses"
              className="group rounded-lg border border-transparent px-5 py-8 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            >
              <h2 className="mb-3 text-2xl font-semibold">
                노선별 조회
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ml-1">
                  →
                </span>
              </h2>
              <p className="text-left">버스 노선별로 시간표를 조회합니다.</p>
            </Link>
          </div>

          <footer className="mt-16 text-center text-sm text-gray-500">
            <p>© 2025 원주 버스 시간표 서비스</p>
            <p className="mt-2">모든 버스 시간표 정보는 2025년 기준입니다.</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
