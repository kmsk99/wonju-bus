"use client";

import { useState } from "react";

interface WaitingTimeProps {
  minutes: number;
}

/**
 * 대기 시간을 시각적으로 표시하는 컴포넌트
 * 남은 시간에 따라 다른 색상과 텍스트 표시
 */
export function WaitingTime({ minutes }: WaitingTimeProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (minutes === -1) {
    return (
      <span
        className="text-gray-400 px-2 py-1 rounded-md transition-all duration-300 inline-block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        출발 완료
      </span>
    );
  }

  if (minutes === 0) {
    return (
      <span
        className="text-white font-bold bg-red-500 px-2 py-1 rounded-md inline-flex items-center space-x-1 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="inline-block animate-pulse">●</span>
        <span>곧 출발</span>
      </span>
    );
  }

  if (minutes < 5) {
    return (
      <span
        className={`text-white font-bold bg-red-500 px-3 py-1 rounded-md inline-block transition-all duration-300 shadow-sm hover:shadow-md ${
          isHovered ? "scale-105" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {minutes}분 후
      </span>
    );
  }

  if (minutes < 10) {
    return (
      <span
        className={`text-white font-bold bg-orange-500 px-3 py-1 rounded-md inline-block transition-all duration-300 shadow-sm hover:shadow-md ${
          isHovered ? "scale-105" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {minutes}분 후
      </span>
    );
  }

  return (
    <span
      className={`text-white bg-blue-500 px-3 py-1 rounded-md inline-block transition-all duration-300 shadow-sm hover:shadow-md ${
        isHovered ? "scale-105" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {minutes}분 후
    </span>
  );
}
