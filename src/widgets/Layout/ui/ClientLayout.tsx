"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("scroll", handleScroll);

    // 초기 스크롤 위치 확인
    handleScroll();

    // 클린업 함수
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className={`bg-primary text-white p-3 sticky top-0 z-50 shadow-lg transition-all duration-300 ${
          scrolled ? "py-1.5 bg-opacity-95 backdrop-blur-sm" : "py-3"
        }`}
      >
        <div className="container mx-auto px-3">
          <Link
            href="/"
            className="group flex items-center hover:text-blue-100 transition-colors"
          >
            <svg
              className="h-6 w-6 mr-2 text-white group-hover:scale-110 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4"
              />
            </svg>
            <h1 className="text-xl font-bold">원주시 버스 종점 정보</h1>
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-3 relative z-10">{children}</main>
      <footer className="bg-gray-100 py-3 mt-8 text-xs">
        <div className="container mx-auto text-center text-gray-600 px-3">
          <p>© 2025 원주시 버스 종점 정보 서비스</p>
        </div>
      </footer>
    </div>
  );
}
