"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Clock } from "@/shared/ui/Clock";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const cards = cardsRef.current;
      const info = infoRef.current;

      if (cards) {
        const cardsTop = cards.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (cardsTop < windowHeight * 0.75) {
          cards.classList.add("opacity-100", "translate-y-0");
          cards.classList.remove("opacity-0", "translate-y-4");
        }
      }

      if (info) {
        const infoTop = info.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (infoTop < windowHeight * 0.75) {
          info.classList.add("opacity-100", "translate-y-0");
          info.classList.remove("opacity-0", "translate-y-4");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    // 초기 실행
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto overflow-hidden">
      <div
        className={`relative overflow-hidden bg-gradient-to-b from-blue-500 to-blue-700 rounded-3xl shadow-xl mt-4 mb-12 transition-all duration-1000 transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="absolute inset-0 opacity-20">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10,30 Q50,10 90,30 T170,30 T250,30 T330,30 T410,30 T450,30 L450,105 L10,105 Z"
              fill="white"
              fillOpacity="0.2"
            />
            <path
              d="M10,55 Q50,35 90,55 T170,55 T250,55 T330,55 T410,55 Q450,55 450,55 L450,105 L10,105 Z"
              fill="white"
              fillOpacity="0.3"
            />
          </svg>
        </div>
        <div className="relative px-8 py-16 text-center text-white z-20">
          <h1
            className={`text-5xl font-bold mb-6 transition-all duration-700 delay-300 transform ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            원주시 버스 종점 출발 시간
          </h1>
          <p
            className={`text-xl mb-6 font-light transition-all duration-700 delay-500 transform ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            원주시 버스의 종점 출발 시간을 확인하고 대기 시간을 실시간으로
            파악해보세요
          </p>
          <div className="flex justify-center items-center">
            <div
              className={`transition-all duration-700 delay-700 transform w-max ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <Clock />
            </div>
          </div>
        </div>
      </div>

      <div
        ref={cardsRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 px-3 mb-12 opacity-0 translate-y-4 transition-all duration-700 delay-100"
      >
        <Link
          href="/stops"
          className="group bg-white rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl hover:scale-[1.02] flex flex-col relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          <div className="flex items-center relative z-10">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors duration-300">
              종점별 조회
            </h2>
          </div>
          <p className="mt-4 text-gray-600 leading-relaxed relative z-10">
            출발지 종점별로 버스 노선을 조회하여 원하는 지역의 모든 버스 정보를
            확인할 수 있습니다.
          </p>
          <div className="mt-auto pt-4 text-blue-600 font-medium flex items-center group-hover:text-blue-700 transition-colors duration-300 relative z-10">
            자세히 보기
            <svg
              className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-2 duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </Link>

        <Link
          href="/buses"
          className="group bg-white rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl hover:scale-[1.02] flex flex-col relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          <div className="flex items-center relative z-10">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors duration-300">
              노선별 조회
            </h2>
          </div>
          <p className="mt-4 text-gray-600 leading-relaxed relative z-10">
            버스 노선별로 시간표를 조회하여 특정 버스의 모든 출발 시간 정보를
            확인할 수 있습니다.
          </p>
          <div className="mt-auto pt-4 text-blue-600 font-medium flex items-center group-hover:text-blue-700 transition-colors duration-300 relative z-10">
            자세히 보기
            <svg
              className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-2 duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </Link>
      </div>

      <div
        ref={infoRef}
        className="bg-blue-50 rounded-2xl p-6 mb-12 mx-4 opacity-0 translate-y-4 transition-all duration-700 shadow-sm hover:shadow-md hover:bg-blue-100/50"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              데이터 최신화 정보
            </h3>
            <p className="text-blue-700">
              모든 버스 시간표 정보는{" "}
              <span className="font-bold">2025년 3월 1일</span> 기준입니다.
            </p>
          </div>
          <div className="bg-white shadow-sm rounded-lg px-3 py-2.5 flex items-center hover:shadow-md transition-all duration-300 hover:bg-blue-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-gray-600">
              정기 업데이트: 매년 노선 개편 후
            </span>
          </div>
        </div>
      </div>

      <footer className="text-center text-gray-500 px-3 mb-8 flex flex-col items-center gap-2">
        <p>© 2025 원주시 버스 종점 정보 서비스</p>
        <p>
          <a
            href="https://github.com/kmsk99"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            @kmsk99
          </a>
        </p>
        <span className="opacity-10">엄마를 위해 만든 서비스</span>
      </footer>
    </div>
  );
}
