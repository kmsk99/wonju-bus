"use client";

import { useEffect, useState } from "react";

/**
 * 실시간 시계 컴포넌트
 */
export function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1초마다 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 시간 포맷팅
  const formattedTime = currentTime.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="text-lg font-bold text-gray-800 mt-2">{formattedTime}</div>
  );
}
