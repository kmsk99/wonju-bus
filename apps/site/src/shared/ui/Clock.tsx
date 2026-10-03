'use client';
import { useEffect, useState } from 'react';
export function Clock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Seoul', hour12: false }));
    tick(); const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  return <time className="departure-clock" aria-label={`현재 한국 시각 ${time ?? ''}`}>{time ?? '--:--:--'}</time>;
}
