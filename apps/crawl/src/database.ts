import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export async function publishSnapshot(snapshot: Record<string, unknown>, durationMs: number) {
  const connection = process.env.DATABASE_URL;
  if (!connection) throw new Error('DATABASE_URL이 필요합니다');
  const sql = neon(connection);
  const payload = JSON.stringify(Object.fromEntries(Object.entries(snapshot).sort(([a], [b]) => a.localeCompare(b, 'en'))));
  const checksum = createHash('sha256').update(payload).digest('hex');
  const count = Object.keys(snapshot).length;
  if (!count) throw new Error('빈 시간표는 게시할 수 없습니다');
  const [previous] = await sql`SELECT route_count FROM schedule_snapshot WHERE id = 1`;
  if (previous && count < Number(previous.route_count) * 0.8) {
    throw new Error('노선 수가 이전보다 20% 이상 감소해 게시를 중단했습니다. 원본 변경을 확인하세요');
  }
  const result = await sql.transaction([
    sql`INSERT INTO schedule_snapshot (id, payload, checksum, route_count)
        VALUES (1, ${payload}::jsonb, ${checksum}, ${count})
        ON CONFLICT (id) DO UPDATE SET
          payload = CASE WHEN schedule_snapshot.checksum <> EXCLUDED.checksum THEN EXCLUDED.payload ELSE schedule_snapshot.payload END,
          updated_at = CASE WHEN schedule_snapshot.checksum <> EXCLUDED.checksum THEN now() ELSE schedule_snapshot.updated_at END,
          checksum = EXCLUDED.checksum, route_count = EXCLUDED.route_count, checked_at = now()
        RETURNING updated_at = checked_at AS changed, route_count`,
    sql`INSERT INTO crawl_runs (route_count, changed, duration_ms)
        SELECT route_count, updated_at = checked_at, ${durationMs} FROM schedule_snapshot WHERE id = 1`,
    sql`DELETE FROM crawl_runs WHERE id NOT IN (SELECT id FROM crawl_runs ORDER BY id DESC LIMIT 60)`,
  ]);
  console.log('Neon 저장 완료:', result[0][0]);
}

export async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL이 필요합니다');
  const sql = neon(process.env.DATABASE_URL);
  const schema = fs.readFileSync(path.resolve(__dirname, '../../../database/schema.sql'), 'utf8');
  for (const statement of schema.split(';').map((s) => s.trim()).filter(Boolean)) await sql.query(statement);
  console.log('데이터베이스 스키마 준비 완료');
}
if (require.main === module) migrate().catch((error) => { console.error(error.message); process.exitCode = 1; });
