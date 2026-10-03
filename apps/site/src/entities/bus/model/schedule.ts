import { DAY_MS, dayStart } from '../../../shared/lib/calendar/calendar';
import { isDayTypeMatch, parseBusFileName } from './dayTypeUtils';
import { BusData, BusOperationInfo } from './types';

export function timeMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]), minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}
export function operationApplies(bus: BusData, op: BusOperationInfo, now = new Date()): boolean {
  const group = parseBusFileName(bus.fileName ?? `wonju-bus-${bus.routeInfo.routeNumber}.json`).dayTypeGroup;
  const excluded = op.note.match(/((?:(?:토요일|일요일|공휴일|평일|주말|휴일|방학|토|일)[\s,ㆍ]*)+)(?:미운행|운행안함)/)?.[1];
  if (excluded && isDayTypeMatch(excluded.replace(/[ㆍ]/g, ',').replace(/[\s,]+$/, ''), false, undefined, now)) return false;
  if (/평일만\s*운행/.test(op.note) && !isDayTypeMatch('평일', false, undefined, now)) return false;
  return isDayTypeMatch(group, false, undefined, now) && isDayTypeMatch(op.category, false, undefined, now);
}
export function operatesOn(bus: BusData, now = new Date()): boolean {
  return bus.operationInfo.some(op => operationApplies(bus, op, now) &&
    (timeMinutes(op.departureTime) !== null || timeMinutes(op.arrivalTime) !== null));
}
export interface Departure {
  routeNumber: string;
  departureTime: string;
  nextDepartureMinutes: number;
  category: string;
  isFromTerminal: boolean;
  isNextDay: boolean;
  tripIndex: number;
  note: string;
}
/** Only genuine remaining departures today/tomorrow. Never roll today's timetable forward. */
export function departuresFromStop(buses: BusData[], stop: string, now = new Date()): Departure[] {
  const result: Departure[] = [];
  const seen = new Set<string>();
  for (const bus of buses) {
    for (let offset = 0; offset <= 1; offset++) {
      const start = dayStart(now) + offset * DAY_MS;
      for (const [index, op] of bus.operationInfo.entries()) {
        if (!operationApplies(bus, op, new Date(start))) continue;
        for (const [name, time, from] of [[op.departureName, op.departureTime, true], [op.arrivalName, op.arrivalTime, false]] as const) {
          const minutes = timeMinutes(time);
          if (name !== stop || minutes === null) continue;
          const at = start + minutes * 60000;
          if (at < now.getTime()) continue;
          const key = `${bus.routeInfo.routeNumber}|${at}|${from}|${op.operationNumber}`;
          if (seen.has(key)) continue;
          seen.add(key);
          result.push({ routeNumber: bus.routeInfo.routeNumber, departureTime: time,
            nextDepartureMinutes: Math.ceil((at - now.getTime()) / 60000),
            category: op.category, note: op.note, isFromTerminal: from, isNextDay: offset === 1,
            tripIndex: Number(op.operationNumber) || index + 1 });
        }
      }
    }
  }
  return result.sort((a, b) => a.nextDepartureMinutes - b.nextDepartureMinutes);
}
export function validateSnapshot(value: unknown): Record<string, BusData> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length) throw new Error('Empty schedule');
  for (const [file, bus] of Object.entries(value)) {
    if (!/^wonju-bus-[^/\\]+\.json$/.test(file) || !bus?.routeInfo?.routeNumber ||
      !Array.isArray(bus.operationInfo) || !bus.operationInfo.length ||
      !['routeNumber','origin','destination','firstBusTime','lastBusTime','operationCount','interval'].every(k => typeof bus.routeInfo[k] === 'string') ||
      !bus.operationInfo.every((op: Record<string, unknown>) => op && ['operationNumber','departureTime','arrivalTime','departureName','arrivalName','category','note'].every(k => typeof op[k] === 'string'))) {
      throw new Error('Invalid schedule');
    }
  }
  return value as Record<string, BusData>;
}
