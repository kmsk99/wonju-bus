'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Clock } from '@/shared/ui/Clock';

type Status = { routeCount: number; checkedAt: string };
export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/schedules?meta=1', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <div className="home-flow">
      <section className="departure-board" aria-labelledby="home-title">
        <div className="board-heading">
          <span className="eyebrow">WONJU · DEPARTURES</span>
          <span className="board-tag">종점 출발 기준</span>
        </div>
        <div className="board-body">
          <div>
            <h1 id="home-title">
              다음 버스,
              <br />몇 시에 출발할까요?
            </h1>
            <p>
              출발할 종점이나 버스 번호를 선택하세요.
              <br />
              오늘의 시간표와 남은 시간을 알려드려요.
            </p>
          </div>
          <div className="board-clock">
            <span>현재 시각 · 한국</span>
            <Clock />
            <div className="route-track" aria-hidden="true">
              <i />
              <span />
              <i />
              <span />
              <i />
            </div>
          </div>
        </div>
      </section>
      <section aria-labelledby="find-title">
        <div className="section-heading">
          <h2 id="find-title">시간표 찾기</h2>
          <span>두 가지 방법으로 바로 확인</span>
        </div>
        <div className="choice-grid">
          <Link href="/stops" className="choice-card">
            <span className="choice-number">01</span>
            <div>
              <span className="choice-kicker">출발 장소를 알고 있다면</span>
              <h3>
                종점으로 찾기 <span aria-hidden="true">↗</span>
              </h3>
              <p>
                관설동, 장양리 등 종점을 선택해
                <br />
                출발하는 모든 버스를 확인하세요.
              </p>
            </div>
            <span className="choice-action">
              종점 목록 열기 <span aria-hidden="true">→</span>
            </span>
          </Link>
          <Link href="/buses" className="choice-card">
            <span className="choice-number">02</span>
            <div>
              <span className="choice-kicker">타려는 버스가 있다면</span>
              <h3>
                노선 번호로 찾기 <span aria-hidden="true">↗</span>
              </h3>
              <p>
                버스 번호를 검색하고
                <br />
                방향별 출발 시간표를 확인하세요.
              </p>
            </div>
            <span className="choice-action">
              노선 목록 열기 <span aria-hidden="true">→</span>
            </span>
          </Link>
        </div>
      </section>
      <aside className="schedule-note">
        <span className="note-symbol" aria-hidden="true">
          i
        </span>
        <div>
          <h2>공식 시간표를 모아두었어요</h2>
          <p>
            {status
              ? `${status.routeCount}개 시간표 · 마지막 확인 ${new Date(
                  status.checkedAt
                ).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}`
              : '매주 월요일 시간표 업데이트'}
            <br />
            표시되는 남은 시간은 시간표 기준이며, 실시간 버스 위치 정보는
            아닙니다.
          </p>
        </div>
      </aside>
    </div>
  );
}
