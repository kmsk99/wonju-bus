import fs from 'fs';
import os from 'os';
import path from 'path';
import { WonjuBusCrawler } from './busCrawler';
import { publishSnapshot } from './database';

async function main() {
  const started = Date.now();
  const repoRoot = path.resolve(__dirname, '../../..');
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'wonju-bus-'));
  try {
    const summary = await new WonjuBusCrawler({ outputDirs: [staging] }).crawlAllBusInfo();
    if (summary.totalRoutes === 0 || summary.failedRoutes.length > 0 || summary.successfulRoutes !== summary.totalRoutes) {
      throw new Error(`수집 실패: ${summary.successfulRoutes}/${summary.totalRoutes}, ${summary.failedRoutes.join(', ')}`);
    }
    const snapshot: Record<string, unknown> = {};
    for (const file of summary.savedFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(staging, file), 'utf8'));
      if (!data.routeInfo?.routeNumber || !Array.isArray(data.operationInfo) || data.operationInfo.length === 0) {
        throw new Error(`시간표 검증 실패: ${file}`);
      }
      snapshot[file] = data;
    }
    fs.writeFileSync(path.join(staging, 'snapshot.json'), JSON.stringify(snapshot));
    if (process.argv.includes('--publish')) {
      await publishSnapshot(snapshot, Date.now() - started);
      return;
    }
    const destinations = ['apps/crawl/data', 'apps/site/data', 'apps/site/public/data', 'apps/flutter/assets/data'];
    for (const relative of destinations) {
      const destination = path.join(repoRoot, relative);
      fs.mkdirSync(destination, { recursive: true });
      for (const file of fs.readdirSync(destination)) {
        if (file.endsWith('.json') && (file.startsWith('wonju-bus-') || ['bus-files.json', 'snapshot.json'].includes(file))) {
          fs.unlinkSync(path.join(destination, file));
        }
      }
      for (const file of fs.readdirSync(staging)) fs.copyFileSync(path.join(staging, file), path.join(destination, file));
    }
    console.log(`${summary.successfulRoutes}개 시간표 검증 및 웹·Flutter 동기화 완료`);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
