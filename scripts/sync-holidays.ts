import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { koreaDate, validateHolidays } from '../apps/site/src/shared/lib/calendar/calendar';

async function main() {
  const year = Number(koreaDate().slice(0, 4));
  const years: Record<string, unknown> = {};
  for (const value of [year - 1, year, year + 1]) {
    const response = await fetch(`https://raw.githubusercontent.com/hyunbinseo/holidays-kr/main/public/${value}.json`, {signal: AbortSignal.timeout(10000)});
    if (response.status === 404 && value === year + 1) continue; // Next year's official calendar may not yet be published.
    if (!response.ok) throw new Error(`공휴일 수집 실패: ${value} HTTP ${response.status}`);
    years[value] = validateHolidays(await response.json(), value);
  }
  const raw = JSON.stringify(years, null, 2) + '\n';
  for (const file of ['apps/site/src/shared/lib/calendar/holidays.json','apps/flutter/assets/data/holidays.json']) {
    writeFileSync(resolve(__dirname, '..', file), raw);
  }
  console.log(`공휴일 오프라인 자료 갱신: ${Object.keys(years).join(', ')}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
