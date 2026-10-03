'use client';
import { useEffect, useState } from 'react';
import { useDayTypeStore } from '@/entities/bus/model/dayTypeState';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { dayTypeText, updateDayTypes } = useDayTypeStore();
  useEffect(() => {
    setMounted(true);
    updateDayTypes();
    const interval = setInterval(updateDayTypes, 60000);
    const refresh = () => updateDayTypes();
    window.addEventListener('focus', refresh);
    return () => { clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [updateDayTypes]);
  return (
    <div className="site-shell">
      <a href="#main-content" className="skip-link">
        본문으로 이동
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="wordmark">
            <span className="brand-mark" aria-hidden="true">
              W
            </span>
            <span>
              원주버스<span className="brand-caption">종점 출발 시간표</span>
            </span>
          </Link>
          <nav aria-label="주 메뉴">
            <Link
              href="/stops"
              aria-current={pathname.startsWith('/stops') ? 'page' : undefined}
            >
              종점 찾기
            </Link>
            <Link
              href="/buses"
              aria-current={pathname.startsWith('/buses') ? 'page' : undefined}
            >
              노선 찾기
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content" className="site-main">
        <p className="px-3 pt-3 text-sm text-gray-600" suppressHydrationWarning>한국 시간 기준 · {mounted ? dayTypeText : '운행일 확인 중'}</p>
        {children}
      </main>
      <footer className="site-footer">
        <span>원주시 ITS 시간표 기준 · 공휴일: <a href="https://github.com/hyunbinseo/holidays-kr">holidays-kr</a></span>
        <span>방학 기간은 노선별 시간표와 원주시 공지를 확인하세요.</span>
        <span>도로 상황에 따라 실제 출발 시간이 달라질 수 있습니다.</span>
      </footer>
    </div>
  );
}
