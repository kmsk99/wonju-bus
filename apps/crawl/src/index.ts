import { WonjuBusCrawler } from "./busCrawler";

async function main() {
  console.log("원주시 버스 정보 크롤링을 시작합니다...");

  const crawler = new WonjuBusCrawler();

  try {
    // 모든 버스 정보 수집
    const summary = await crawler.crawlAllBusInfo();

    console.log(
      `총 ${summary.totalRoutes}개 노선 중 ${summary.successfulRoutes}개 데이터를 저장했습니다.`
    );
    if (summary.failedRoutes.length > 0) {
      console.warn(
        `수집에 실패한 노선: ${summary.failedRoutes.join(", ")}`
      );
      process.exitCode = 1;
    }

    if (summary.outputDirs.length > 0) {
      console.log("데이터 저장 위치:");
      summary.outputDirs.forEach((dir) => console.log(` - ${dir}`));
    }

    // 원하는 경우 특정 버스 노선만 수집할 수도 있습니다
    // const busInfo = await crawler.getBusInfo('2');
    // console.log(JSON.stringify(busInfo, null, 2));
  } catch (error) {
    console.error("크롤링 중 오류가 발생했습니다:", error);
  }
}

// 프로그램 실행
main().catch(console.error);
