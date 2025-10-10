import fs from "fs";
import path from "path";

import { WonjuBusCrawler } from "./busCrawler";

/**
 * 특정 버스 노선 정보만 크롤링
 * @param routeNumber 버스 노선 번호
 */
async function crawlSingleRoute(routeNumber: string): Promise<void> {
  console.log(`원주시 버스 ${routeNumber}번 정보 크롤링을 시작합니다...`);

  const crawler = new WonjuBusCrawler();

  try {
    // 해당 버스 노선 정보 수집
    const busInfo = await crawler.getBusInfo(routeNumber);

    if (busInfo) {
      // 결과를 JSON 파일로 저장
      const outputDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, `wonju-bus-${routeNumber}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(busInfo, null, 2), "utf-8");

      console.log(`크롤링 완료! 데이터가 저장된 위치: ${outputPath}`);
      console.log("\n버스 정보 요약:");
      console.log(`노선번호: ${busInfo.routeInfo.routeNumber}`);
      console.log(
        `운행 구간: ${busInfo.routeInfo.origin} - ${busInfo.routeInfo.destination}`
      );
      console.log(
        `첫차/막차: ${busInfo.routeInfo.firstBusTime} - ${busInfo.routeInfo.lastBusTime}`
      );
      console.log(`운행 횟수: ${busInfo.routeInfo.operationCount}`);
      console.log(`배차 간격: ${busInfo.routeInfo.interval}`);
      console.log(`총 운행 정보: ${busInfo.operationInfo.length}개`);
    } else {
      console.log(`버스 ${routeNumber}번 정보를 찾을 수 없습니다.`);
    }
  } catch (error) {
    console.error("크롤링 중 오류가 발생했습니다:", error);
  }
}

// 명령행 인자로 버스 노선 번호를 받아서 실행
const routeNumber = process.argv[2];

if (!routeNumber) {
  console.log("사용법: pnpm ts-node src/crawlSingleRoute.ts [버스노선번호]");
  console.log("예시: pnpm ts-node src/crawlSingleRoute.ts 2");
  process.exit(1);
}

// 프로그램 실행
crawlSingleRoute(routeNumber).catch(console.error);
