import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const pubspec = readFileSync(path.join(root, 'apps/flutter/pubspec.yaml'), 'utf8');
const match = pubspec.match(/^version: (\d+\.\d+\.\d+)\+(\d+)$/m);
if (!match) throw new Error('pubspec.yaml에 version: x.y.z+빌드번호가 필요합니다.');
const [, version, buildNumber] = match;
const source = path.join(root, 'apps/flutter/build/app/outputs/flutter-apk/app-release.apk');
const fileName = `wonju-bus-${version}.apk`;
const folder = path.join(root, 'dist/android', version);
mkdirSync(folder, { recursive: true });
copyFileSync(source, path.join(folder, fileName));
const sha256 = createHash('sha256').update(readFileSync(source)).digest('hex');
writeFileSync(path.join(folder, 'SHA256SUMS.txt'), `${sha256}  ${fileName}\n`);
const metadata = {
  version, buildNumber: Number(buildNumber), minimumAndroid: '7.0',
  sizeBytes: statSync(source).size, sha256,
  url: `https://github.com/kmsk99/wonju-bus/releases/download/android-v${version}/${fileName}`,
};
const config = path.join(root, 'apps/site/src/shared/config');
mkdirSync(config, { recursive: true });
writeFileSync(path.join(config, 'android-release.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(`APK 및 체크섬: ${folder}\n웹 다운로드 정보: ${version} (${buildNumber})`);
