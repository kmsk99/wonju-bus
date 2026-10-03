import { NextRequest, NextResponse } from 'next/server';
import bundled from '@/shared/lib/calendar/holidays.json';
import { HolidayDates, koreaDate, validateHolidays } from '@/shared/lib/calendar/calendar';

export const preferredRegion = 'sin1';
export async function GET(request: NextRequest) {
  const yearText = request.nextUrl.searchParams.get('year') ?? koreaDate().slice(0, 4);
  const year = Number(yearText);
  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300, s-maxage=21600' };
  if (!/^\d{4}$/.test(yearText) || year < 2018 || year > Number(koreaDate().slice(0, 4)) + 1) {
    return NextResponse.json({ error: '지원하지 않는 연도입니다.' }, { status: 400 });
  }
  try {
    // Public, keyless data compiled from Korea's official calendar announcements.
    const response = await fetch(`https://raw.githubusercontent.com/hyunbinseo/holidays-kr/main/public/${year}.json`, {
      next: { revalidate: 21600 }, signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Calendar unavailable');
    const holidays = validateHolidays(await response.json(), year);
    return NextResponse.json({ year, holidays, source: 'holidays-kr', fallback: false }, { headers });
  } catch {
    const holidays = (bundled as Record<string, HolidayDates>)[year];
    if (holidays) return NextResponse.json({ year, holidays, source: 'holidays-kr', fallback: true }, {
      headers: { ...headers, 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    });
    return NextResponse.json({ error: '공휴일 정보를 확인할 수 없습니다.' }, {
      status: 503, headers: { ...headers, 'Cache-Control': 'no-store' },
    });
  }
}
