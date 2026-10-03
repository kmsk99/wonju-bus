import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'sin1';

export async function GET(request: NextRequest) {
  const cors = { 'Access-Control-Allow-Origin': '*' };
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: '시간표 연결을 준비 중입니다.' },
      { status: 503, headers: { ...cors, 'Cache-Control': 'no-store' } }
    );
  }
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [row] =
      await sql`SELECT payload, checksum, updated_at, checked_at, route_count FROM schedule_snapshot WHERE id = 1`;
    if (!row) throw new Error('No schedule');
    const metadataOnly = request.nextUrl.searchParams.get('meta') === '1';
    const headers = {
      ...cors,
      'Cache-Control':
        'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
      ETag: `"${row.checksum}${
        metadataOnly ? `-${new Date(row.checked_at).getTime()}` : ''
      }"`,
      'X-Schedule-Updated-At': new Date(row.updated_at).toISOString(),
      'X-Schedule-Checked-At': new Date(row.checked_at).toISOString(),
      'Access-Control-Expose-Headers':
        'ETag, X-Schedule-Updated-At, X-Schedule-Checked-At',
    };
    if (request.headers.get('if-none-match') === headers.ETag)
      return new NextResponse(null, { status: 304, headers });
    const body = metadataOnly
      ? {
          routeCount: row.route_count,
          updatedAt: row.updated_at,
          checkedAt: row.checked_at,
        }
      : row.payload;
    return NextResponse.json(body, { headers });
  } catch {
    return NextResponse.json(
      { error: '시간표를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503, headers: { ...cors, 'Cache-Control': 'no-store' } }
    );
  }
}
