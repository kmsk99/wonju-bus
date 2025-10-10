import { WonjuBusCrawler } from "./busCrawler";

/**
 * 여러 버스 노선을 한 번에 크롤링하는 테스트
 */
async function testMultipleRoutes() {
  console.log("여러 버스 노선 크롤링 테스트를 시작합니다...");

  // 크롤러 생성 (헤드리스 모드)
  const crawler = new WonjuBusCrawler({
    headless: true, // 실제 UI가 보이지 않는 모드 사용
    timeout: 60000,
  });

  try {
    // 테스트할 버스 노선 목록
    const testRoutes = ["2(평일)", "2(토요일)", "2(일,공휴일)"];

    console.log(`총 ${testRoutes.length}개 노선을 크롤링합니다...`);
    let successCount = 0;
    let failCount = 0;

    for (const routeNumber of testRoutes) {
      console.log(`\n노선 "${routeNumber}" 크롤링 중...`);
      const busInfo = await crawler.getBusInfo(routeNumber);

      if (busInfo) {
        console.log(
          `✓ ${routeNumber} 노선 크롤링 성공 (운행 정보 ${busInfo.operationInfo.length}개)`
        );

        // 파일 저장
        crawler["saveBusInfoToJson"](routeNumber, busInfo);
        successCount++;
      } else {
        console.log(`✗ ${routeNumber} 노선 크롤링 실패`);
        failCount++;
      }
    }

    console.log("\n크롤링 결과 요약:");
    console.log(`총 노선: ${testRoutes.length}`);
    console.log(`성공: ${successCount}`);
    console.log(`실패: ${failCount}`);
  } catch (error) {
    console.error("테스트 중 오류가 발생했습니다:", error);
  }
}

// 테스트 실행
testMultipleRoutes().catch(console.error);
