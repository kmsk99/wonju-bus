"use client";

import { useEffect, useState } from "react";

/**
 * 실시간 시계 컴포넌트
 */
export function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPulsing, setIsPulsing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트 사이드에서만 렌더링되도록 마운트 상태 설정
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1초마다 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      // 초가 바뀔 때마다 펄스 애니메이션 효과 추가
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 500);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 시간 포맷팅
  const formattedTime = currentTime.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // 시, 분, 초 분리
  const [hours, minutes, seconds] = formattedTime.split(":");

  // 클라이언트 측에서만 렌더링
  if (!isMounted) {
    return <div className="w-[180px] h-[48px] bg-black/70 rounded-lg"></div>;
  }

  return (
    <div className="flex items-center justify-center space-x-1 bg-black/70 rounded-lg px-4 py-2 shadow-lg border border-white/20">
      <div className="flex items-end">
        <div className="text-3xl font-bold text-white">{hours}</div>
        <div
          className={`text-3xl font-bold ${
            isPulsing ? "text-yellow-300" : "text-white"
          } transition-colors duration-300`}
        >
          :
        </div>
        <div className="text-3xl font-bold text-white">{minutes}</div>
        <div
          className={`text-3xl font-bold ${
            isPulsing ? "text-yellow-300" : "text-white"
          } transition-colors duration-300`}
        >
          :
        </div>
        <div
          className={`text-3xl font-bold ${
            isPulsing ? "scale-110 text-yellow-300" : "scale-100 text-white"
          } transition-all duration-300`}
        >
          {seconds}
        </div>
      </div>
    </div>
  );
}
