import assert from 'node:assert/strict';
import { getCurrentDayTypes, isDayTypeMatch } from '../apps/site/src/entities/bus/model/dayTypeUtils';
import { departuresFromStop, operatesOn, operationApplies, timeMinutes, validateSnapshot } from '../apps/site/src/entities/bus/model/schedule';
import { BusData } from '../apps/site/src/entities/bus/model/types';
import { ensureCalendar, holidayNames, koreaDate, validateHolidays } from '../apps/site/src/shared/lib/calendar/calendar';
import holidays from '../apps/site/src/shared/lib/calendar/holidays.json';
import snapshot from '../apps/site/public/data/snapshot.json';
import { getRouteCountForTerminal, loadAllBusData, loadBusData, loadTerminals } from '../apps/site/src/entities/bus/api/loadBusData';

const date = (s: string) => new Date(`${s}T00:00:00+09:00`);
for (const day of ['2025-01-27','2025-06-03','2026-03-02','2026-05-01','2026-06-03','2026-07-17','2026-10-03','2026-10-05','2027-12-27']) {
  assert.ok(holidayNames(date(day)).length, day);
  assert.deepEqual(getCurrentDayTypes(false, undefined, date(day)), ['공휴일','휴일','공통']);
  assert.equal(isDayTypeMatch('평일, 토요일', false, undefined, date(day)), false);
}
assert.equal(koreaDate(new Date('2026-10-04T15:00:00Z')), '2026-10-05');
assert.equal(isDayTypeMatch('평일, 토요일', false, undefined, date('2026-10-10')), true);
assert.equal(isDayTypeMatch('토, 일', false, undefined, date('2026-10-04')), true);
assert.deepEqual(getCurrentDayTypes(false, undefined, date('2099-01-03')), ['공통']);
assert.deepEqual(getCurrentDayTypes(true, false, date('2026-10-06')), ['방학','공통']);
for (const invalid of ['-','순환','통학12','24:00','09:60','abc','']) assert.equal(timeMinutes(invalid), null);
assert.equal(timeMinutes('8:05'), 485);
assert.throws(() => validateHolidays({}, 2026));
assert.throws(() => validateHolidays({ ...holidays['2026'], '2026-02-30': ['wrong'] }, 2026));
assert.throws(() => validateSnapshot({ 'wonju-bus-1.json': {routeInfo: {routeNumber:'1'},operationInfo:[{}]} }));

const buses = Object.entries(snapshot).map(([fileName, bus]) => ({ ...bus, fileName })) as BusData[];
const bus = (route: string) => buses.find(b => b.routeInfo.routeNumber === route)!;
assert.equal(operatesOn(bus('59'), date('2026-10-05')), false); // note-only restriction
assert.equal(operatesOn(bus('81'), date('2026-10-04')), false);
assert.equal(operatesOn(bus('조조'), date('2026-10-04')), false);
const op41 = bus('41(주말,공휴일)').operationInfo.find(op => op.operationNumber === '3')!;
assert.equal(operationApplies(bus('41(주말,공휴일)'), op41, date('2026-10-04')), false);
assert.equal(operationApplies(bus('41(주말,공휴일)'), op41, date('2026-10-10')), true);
assert.equal(operatesOn(bus('8(주말,공휴일)'), date('2026-10-04')), true); // location-specific note is not whole-route cancellation

function fixture(route: string, departureTime: string, arrivalTime = '-') : BusData {
  return { ...bus('10'), routeInfo: {...bus('10').routeInfo, routeNumber:route}, fileName:`wonju-bus-${route}.json`,
    operationInfo:[{ operationNumber:'1', departureTime, arrivalTime, departureName:'A',arrivalName:'B',category:'공통',note:''}] };
}
const service = [fixture('2(평일)','08:00'), fixture('2(토요일)','09:00'), fixture('2(일,공휴일)','10:00')];
let result = departuresFromStop(service, 'A', new Date('2026-10-02T22:00:00+09:00'));
assert.deepEqual(result.map(d => [d.routeNumber,d.isNextDay,d.nextDepartureMinutes]), [['2(일,공휴일)',true,720]]); // Saturday holiday
result = departuresFromStop(service,'A', new Date('2026-10-04T22:00:00+09:00'));
assert.equal(result[0].routeNumber,'2(일,공휴일)'); // Monday substitute holiday
result = departuresFromStop(service,'A', new Date('2026-10-05T22:00:00+09:00'));
assert.equal(result[0].routeNumber,'2(평일)');
result = departuresFromStop(service,'A', new Date('2026-12-31T22:00:00+09:00'));
assert.equal(result[0].routeNumber,'2(일,공휴일)');
assert.equal(departuresFromStop([fixture('10','08:00')], 'A',new Date('2026-10-06T08:00:01+09:00')).every(d => d.isNextDay),true);
assert.equal(departuresFromStop([fixture('10','08:00')], 'A',new Date('2026-10-06T07:59:59+09:00'))[0].nextDepartureMinutes,1);
assert.equal(departuresFromStop([fixture('10','08:00','12:00')], 'B',date('2026-10-06'))[0].departureTime,'12:00');
assert.equal(departuresFromStop([fixture('10','순환')], 'A',date('2026-10-06')).length,0);

async function integration() {
  let requests = 0;
  const original = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => key === 'holidays:2026' ? JSON.stringify({...holidays['2026'], '2026-10-06':['temporary test']}) : null,
    setItem: () => {},
  }});
  globalThis.fetch = async input => {
    if (String(input).startsWith('/api/holidays')) return new Response(JSON.stringify({fallback:true, holidays: holidays[String(input).slice(-4) as keyof typeof holidays]}));
    requests++;
    return new Response(JSON.stringify(snapshot));
  };
  try {
    await ensureCalendar(date('2026-10-05'));
    assert.deepEqual(holidayNames(date('2026-10-06')), ['temporary test'], 'Server bundle must not replace newer client cache');
    await Promise.all([loadAllBusData(), loadAllBusData(), loadTerminals()]);
    assert.equal(requests, 1, 'Deduplicate simultaneous schedule requests');
    assert.equal((await loadBusData('2(평일)'))?.routeInfo.routeNumber, '2(평일)');
    assert.equal(await loadBusData('1'), null, 'Never match route 1 to 10 or 100');
    const expected = new Set(buses.filter(b => b.operationInfo.some(op => [op.departureName,op.arrivalName].includes('관설동종점'))).map(b => b.routeInfo.routeNumber.replace(/\(.*\)/,''))).size;
    assert.equal(getRouteCountForTerminal('관설동종점'), expected, 'Count routes rather than timetable rows');
  } finally {
    globalThis.fetch = original;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
  console.log('운행일·공휴일·KST·자정·비고 제한·API 동시 요청 회귀 검증 통과');
}
integration().catch(error => { console.error(error); process.exitCode = 1; });
