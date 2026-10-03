import bundled from './holidays.json';

export type HolidayDates = Record<string, string[]>;
const calendars: Record<string, HolidayDates> = { ...bundled };
const refreshed = new Map<number, number>();
const pending = new Map<number, Promise<void>>();
export const KST_OFFSET = 9 * 60 * 60 * 1000;
export const DAY_MS = 86400000;
export function koreaDate(now = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET).toISOString().slice(0, 10);
}
export function dayStart(now = new Date()): number {
  return Date.parse(`${koreaDate(now)}T00:00:00+09:00`);
}
export function holidayKnown(now = new Date()): boolean {
  return !!calendars[koreaDate(now).slice(0, 4)];
}
export function holidayNames(now = new Date()): string[] {
  const date = koreaDate(now);
  return calendars[date.slice(0, 4)]?.[date] ?? [];
}
export function validateHolidays(value: unknown, year: number): HolidayDates {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid calendar');
  const entries = Object.entries(value);
  if (entries.length < 10 || entries.length > 100) throw new Error('Incomplete calendar');
  for (const [date, names] of entries) {
    if (!date.startsWith(`${year}-`) || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date ||
        !Array.isArray(names) || !names.length || names.some(n => typeof n !== 'string' || !n.trim())) {
      throw new Error('Invalid holiday');
    }
  }
  if (!(`${year}-01-01` in value) || !(`${year}-12-25` in value)) throw new Error('Incomplete year');
  return value as HolidayDates;
}
export async function ensureCalendar(now = new Date()): Promise<void> {
  const year = Number(koreaDate(now).slice(0, 4));
  await Promise.all([year, year + 1].map(async year => {
    if (Date.now() - (refreshed.get(year) ?? 0) < 6 * 3600000) return;
    if (pending.has(year)) return pending.get(year);
    const work = (async () => {
      let hasCached = false;
      try {
        const cached = localStorage.getItem(`holidays:${year}`);
        if (cached) { calendars[year] = validateHolidays(JSON.parse(cached), year); hasCached = true; }
      } catch { /* Storage may be unavailable. */ }
      try {
        const response = await fetch(`/api/holidays?year=${year}`, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error('Calendar unavailable');
        const payload = await response.json();
        const dates = validateHolidays(payload.holidays, year);
        if (payload.fallback && hasCached) {
          refreshed.set(year, Date.now() - 6 * 3600000 + 300000);
          return; // A server bundle must not overwrite newer device data.
        }
        calendars[year] = dates;
        refreshed.set(year, Date.now());
        try { localStorage.setItem(`holidays:${year}`, JSON.stringify(dates)); } catch { /* Use memory. */ }
      } catch {
        // Keep the last valid calendar; retry after five minutes.
        refreshed.set(year, Date.now() - 6 * 3600000 + 300000);
      }
    })().finally(() => pending.delete(year));
    pending.set(year, work);
    return work;
  }));
}
