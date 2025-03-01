import { WonjuBusCrawler } from "./busCrawler";

/**
 * 목록 테이블에서 버스 노선 기본 정보를 추출하는 테스트
 */
async function testBasicInfoExtract() {
  console.log("버스 노선 기본 정보 추출 테스트를 시작합니다...");

  // UI 모드 크롤러 생성
  const crawler = new WonjuBusCrawler({
    headless: false,
    slowMo: 300,
    timeout: 60000,
  });

  try {
    // 모든 버스 노선 기본 정보 목록 가져오기
    console.log("모든 버스 노선 기본 정보를 가져오는 중...");
    const routeInfoList = await crawler.getBusRouteNumbers();

    console.log(`총 ${routeInfoList.length}개의 버스 노선 정보를 찾았습니다.`);

    // 첫 5개 노선의 기본 정보 출력
    console.log("\n첫 5개 노선 기본 정보:");
    const display = Math.min(routeInfoList.length, 5);

    for (let i = 0; i < display; i++) {
      const info = routeInfoList[i];
      console.log(`[${i + 1}] 노선번호: ${info.routeNumber}`);
      console.log(`    출발지: ${info.origin}`);
      console.log(`    도착지: ${info.destination}`);
      console.log(`    첫차/막차: ${info.firstBusTime} - ${info.lastBusTime}`);
      console.log(`    운행횟수: ${info.operationCount}`);
      console.log(`    배차간격: ${info.interval}`);
      console.log("------------------------------");
    }

    // 특정 노선(예: "2(평일)")의 상세 정보 가져오기 테스트
    if (routeInfoList.length > 0) {
      const testRouteNumber = "2(평일)";
      console.log(`\n노선 "${testRouteNumber}"의 상세 정보를 가져오는 중...`);

      const busInfo = await crawler.getBusInfo(testRouteNumber);

      if (busInfo) {
        console.log("\n버스 기본 정보:");
        console.log(`노선번호: ${busInfo.routeInfo.routeNumber}`);
        console.log(`출발지: ${busInfo.routeInfo.origin}`);
        console.log(`도착지: ${busInfo.routeInfo.destination}`);
        console.log(
          `첫차/막차: ${busInfo.routeInfo.firstBusTime} - ${busInfo.routeInfo.lastBusTime}`
        );
        console.log(`운행횟수: ${busInfo.routeInfo.operationCount}`);
        console.log(`배차간격: ${busInfo.routeInfo.interval}`);

        console.log(`\n운행 정보 총 ${busInfo.operationInfo.length}개:`);
        const opDisplay = Math.min(busInfo.operationInfo.length, 3);

        for (let i = 0; i < opDisplay; i++) {
          const op = busInfo.operationInfo[i];
          console.log(
            `[${op.operationNumber}] ${op.departureTime} → ${op.arrivalTime} (${
              op.category
            })${op.note ? ` - ${op.note}` : ""}`
          );
        }
      } else {
        console.log(`노선 "${testRouteNumber}"의 정보를 가져오지 못했습니다.`);
      }
    }
  } catch (error) {
    console.error("테스트 중 오류가 발생했습니다:", error);
  }
}

// 테스트 실행
testBasicInfoExtract().catch(console.error);
