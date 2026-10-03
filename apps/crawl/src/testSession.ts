import assert from 'node:assert/strict';
import { WonjuBusCrawler } from './busCrawler';

const originalFetch = global.fetch;
const wrap = (body: string) => `<div id="content"><div class="sub_inner"><div class="para tbl_cont"><div><table>${body}</table></div></div></div></div>`;
async function main() {
  let requests = 0;
  global.fetch = (async (_url: unknown, init?: RequestInit) => {
    requests++;
    if (requests === 1) return new Response('<input name="CSRFToken" value="test-token">' + wrap('<tbody><tr><td>2</td><td>A</td><td>B</td><td>06:00</td><td>22:00</td><td>1</td><td>60</td></tr></tbody>'), { headers: { 'set-cookie': 'JSESSIONID=test-session; Path=/; HttpOnly' } });
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers.Cookie, 'JSESSIONID=test-session');
    assert.equal(new URLSearchParams(init?.body as string).get('CSRFToken'), 'test-token');
    assert.equal(new URLSearchParams(init?.body as string).get('no'), '2');
    return new Response(wrap('<thead><tr><th>번호</th><th>A발</th><th>B발</th><th>구분</th><th>비고</th></tr></thead><tbody><tr><td>1</td><td>06:00</td><td>07:00</td><td>공통</td><td></td></tr></tbody>'));
  }) as typeof fetch;
  const data = await new WonjuBusCrawler().getBusInfo('2');
  assert.equal(data?.operationInfo[0].departureTime, '06:00');
  global.fetch = (async () => new Response('Forbidden', { status: 403 })) as typeof fetch;
  await assert.rejects(() => new WonjuBusCrawler().getBusRouteNumbers(), /HTTP 403/);
  global.fetch = (async () => new Response('<html>maintenance</html>')) as typeof fetch;
  assert.equal(await new WonjuBusCrawler().getBusInfo('2'), null);
  console.log('세션 전달·HTTP 오류·빈 시간표 회귀 검증 통과');
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => { global.fetch = originalFetch; });
