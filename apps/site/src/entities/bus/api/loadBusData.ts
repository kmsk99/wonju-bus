import { ensureCalendar, dayStart } from '../../../shared/lib/calendar/calendar';
import { parseBusFileName } from '../model/dayTypeUtils';
import { departuresFromStop, operatesOn, operationApplies, timeMinutes, validateSnapshot } from '../model/schedule';
import { BusData } from '../model/types';

let schedules: BusData[] = [];
let loadedAt = 0;
let pending: Promise<void> | undefined;
const routeCounts: Record<string, number> = {};

async function ensureSchedules() {
  if (schedules.length && Date.now() - loadedAt < 300000) return;
  if (pending) return pending;
  pending = (async () => {
    let snapshot;
    try {
      const response = await fetch('/api/schedules', { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Schedule unavailable');
      snapshot = validateSnapshot(await response.json());
    } catch {
      if (schedules.length) { loadedAt = Date.now(); return; }
      const response = await fetch('/data/snapshot.json');
      if (!response.ok) throw new Error('저장된 시간표를 읽을 수 없습니다');
      snapshot = validateSnapshot(await response.json());
    }
    schedules = Object.entries(snapshot).map(([fileName, bus]) => ({ ...bus, fileName }));
    loadedAt = Date.now();
  })().finally(() => { pending = undefined; });
  return pending;
}
export async function loadAllBusData(): Promise<BusData[]> {
  await Promise.all([ensureCalendar(), ensureSchedules()]);
  return schedules.map(bus => ({ ...bus, operatesToday: operatesOn(bus) }));
}
export async function loadBusData(routeNumber: string): Promise<BusData | null> {
  const buses = await loadAllBusData();
  const exact = buses.find(bus => bus.routeInfo.routeNumber === routeNumber);
  if (exact) return exact;
  const variants = buses.filter(bus => parseBusFileName(bus.fileName!).routeNumber === routeNumber);
  return variants.find(bus => bus.operatesToday) ?? variants[0] ?? null;
}
export async function isRouteOperatingToday(routeNumber: string): Promise<boolean> {
  return (await loadBusData(routeNumber))?.operatesToday ?? false;
}
export async function loadTerminals(): Promise<string[]> {
  const buses = await loadAllBusData();
  const routes = new Map<string, Set<string>>();
  for (const bus of buses) for (const op of bus.operationInfo) {
    for (const name of [op.departureName, op.arrivalName]) {
      if (!name.trim() || name === '-') continue;
      if (!routes.has(name)) routes.set(name, new Set());
      routes.get(name)!.add(parseBusFileName(bus.fileName!).routeNumber);
    }
  }
  for (const [name, set] of routes) routeCounts[name] = set.size;
  return [...routes.keys()].sort((a, b) => routeCounts[b] - routeCounts[a] || a.localeCompare(b, 'ko'));
}
export function getRouteCountForTerminal(terminalName: string): number { return routeCounts[terminalName] ?? 0; }
export async function loadRoutesByTerminal(terminalName: string): Promise<string[]> {
  return (await loadAllBusData()).filter(bus => bus.operationInfo.some(op => op.departureName === terminalName)).map(bus => bus.routeInfo.routeNumber);
}
export async function loadRoutesToTerminal(terminalName: string): Promise<string[]> {
  return (await loadAllBusData()).filter(bus => bus.operationInfo.some(op => op.arrivalName === terminalName)).map(bus => bus.routeInfo.routeNumber);
}
export async function getBusDepartureTimes(routeNumber: string, stopName: string): Promise<{times: string[]; categories: string[]}> {
  const bus = await loadBusData(routeNumber);
  const times: string[] = [], categories: string[] = [];
  if (bus) for (const op of bus.operationInfo) {
    if (!operationApplies(bus, op)) continue;
    for (const [name, time] of [[op.departureName, op.departureTime], [op.arrivalName, op.arrivalTime]]) {
      if (name === stopName && timeMinutes(time) !== null) { times.push(time); categories.push(op.category); }
    }
  }
  return { times, categories };
}
export function getTimeUntilNextBus(time: string, now = new Date()): number {
  const minutes = timeMinutes(time);
  if (minutes === null) return -1;
  const delta = dayStart(now) + minutes * 60000 - now.getTime();
  return delta < 0 ? -1 : Math.ceil(delta / 60000);
}
export async function getAllDepartureTimesFromStop(stopName: string) {
  return departuresFromStop(await loadAllBusData(), stopName);
}
