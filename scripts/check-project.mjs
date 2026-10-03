import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');
const web = read('apps/site/public/data/snapshot.json');
assert.equal(web, read('apps/flutter/assets/data/snapshot.json'), '웹과 Flutter 오프라인 시간표가 다릅니다. pnpm crawl을 실행하세요.');
assert.equal(read('apps/site/src/shared/lib/calendar/holidays.json'), read('apps/flutter/assets/data/holidays.json'), '웹과 Flutter 공휴일 데이터가 다릅니다.');
const snapshot = JSON.parse(web);
assert.ok(Object.keys(snapshot).length > 0);
for (const [file, route] of Object.entries(snapshot)) {
  assert.match(file, /^wonju-bus-[^/\\]+\.json$/);
  assert.ok(route.routeInfo.routeNumber && route.operationInfo.length > 0, file);
}
const release = JSON.parse(read('apps/site/src/shared/config/android-release.json'));
assert.ok(read('apps/flutter/pubspec.yaml').includes(`version: ${release.version}+${release.buildNumber}`), '앱 버전과 다운로드 정보가 다릅니다. pnpm build:apk를 실행하세요.');
assert.equal(release.url, `https://github.com/kmsk99/wonju-bus/releases/download/android-v${release.version}/wonju-bus-${release.version}.apk`);
assert.match(release.sha256, /^[a-f0-9]{64}$/);
assert.ok(release.sizeBytes > 0);
console.log(`프로젝트 검증 통과: ${Object.keys(snapshot).length}개 시간표, Android ${release.version}+${release.buildNumber}`);
