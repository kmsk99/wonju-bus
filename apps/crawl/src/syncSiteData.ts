import path from "path";

import { WonjuBusCrawler } from "./busCrawler";

async function main() {
  const repoRoot = path.resolve(__dirname, "../../..");
  const crawlDataDir = path.resolve(repoRoot, "apps/crawl/data");
  const siteDataDir = path.resolve(repoRoot, "apps/site/data");
  const sitePublicDataDir = path.resolve(repoRoot, "apps/site/public/data");

  const crawler = new WonjuBusCrawler({
    outputDirs: [crawlDataDir, siteDataDir, sitePublicDataDir],
  });

  console.log("원주시 버스 데이터 전체 크롤링 및 동기화를 시작합니다...");

  const summary = await crawler.crawlAllBusInfo();

  console.log(
    `총 ${summary.totalRoutes}개 노선 중 ${summary.successfulRoutes}개 노선 데이터를 반영했습니다.`
  );

  if (summary.failedRoutes.length > 0) {
    console.warn(
      `수집에 실패한 노선 (${summary.failedRoutes.length}개): ${summary.failedRoutes.join(
        ", "
      )}`
    );
    process.exitCode = 1;
  }

  console.log("동기화가 완료된 디렉터리:");
  summary.outputDirs.forEach((dir) => console.log(` - ${dir}`));
}

main().catch((error) => {
  console.error("크롤링 파이프라인 실행 중 오류가 발생했습니다.", error);
  process.exitCode = 1;
});
