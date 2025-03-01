"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useState } from "react";

import { getTodayDayType } from "../lib/utils/bus-time";

export function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dayType, setDayType] = useState(getTodayDayType());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 날짜 포맷 (예: 2023년 10월 15일 일요일)
  const formattedDate = format(currentTime, "yyyy년 MM월 dd일 EEEE", {
    locale: ko,
  });

  // 시간 포맷 (예: 오후 3:45:23)
  const formattedTime = format(currentTime, "a h:mm:ss", { locale: ko });

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 max-w-xs mx-auto">
      <div className="flex flex-col items-center">
        <div className="text-gray-600 text-sm mb-1">{formattedDate}</div>
        <div className="text-2xl font-semibold">{formattedTime}</div>
        <div className="mt-1 px-2 py-1 text-xs rounded-full bg-primary text-white">
          {dayType === "공통" ? "모든 요일" : dayType}
        </div>
      </div>
    </div>
  );
}
