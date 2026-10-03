'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="site-shell">
    <a href="#main-content" className="skip-link">본문으로 이동</a>
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark"><span className="brand-mark" aria-hidden="true">W</span><span>원주버스<span className="brand-caption">종점 출발 시간표</span></span></Link>
        <nav aria-label="주 메뉴">
          <Link href="/stops" aria-current={pathname.startsWith('/stops') ? 'page' : undefined}>종점 찾기</Link>
          <Link href="/buses" aria-current={pathname.startsWith('/buses') ? 'page' : undefined}>노선 찾기</Link>
        </nav>
      </div>
    </header>
    <main id="main-content" className="site-main">{children}</main>
    <footer className="site-footer"><span>원주시 ITS 시간표 기준</span><span>도로 상황에 따라 실제 출발 시간이 달라질 수 있습니다.</span></footer>
  </div>;
}
