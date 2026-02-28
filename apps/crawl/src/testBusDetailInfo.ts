import { WonjuBusCrawler } from "./busCrawler";

/**
 * 버스 상세 정보 추출 테스트
 * - 동적인 출발/도착지를 가진 테이블 처리
 */
async function testBusDetailInfo() {
  console.log("버스 상세 정보 추출 테스트를 시작합니다...");

  const crawler = new WonjuBusCrawler();

  try {
    // 테스트할 버스 노선 목록
    const testRoutes = ["2(평일)", "2(토요일)"];

    for (const routeNumber of testRoutes) {
      console.log(`\n노선 "${routeNumber}"의 상세 정보를 가져오는 중...`);
      const busInfo = await crawler.getBusInfo(routeNumber);

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
        // 처음 5개 운행 정보 출력
        const displayCount = Math.min(busInfo.operationInfo.length, 5);

        console.log(
          "출발/도착지: ",
          busInfo.operationInfo[0]?.departureName,
          "->",
          busInfo.operationInfo[0]?.arrivalName
        );

        for (let i = 0; i < displayCount; i++) {
          const op = busInfo.operationInfo[i];
          console.log(
            `[${op.operationNumber}] ${op.departureTime} → ${op.arrivalTime} (${
              op.category
            })${op.note ? ` - ${op.note}` : ""}`
          );
        }

        // 개별 파일 저장 테스트
        console.log(`\n${routeNumber} 노선 정보를 파일로 저장합니다...`);
        crawler["saveBusInfoToJson"](routeNumber, busInfo); // private 메서드 접근을 위한 방식
      } else {
        console.log(`노선 "${routeNumber}"의 정보를 가져오지 못했습니다.`);
      }
    }
  } catch (error) {
    console.error("테스트 중 오류가 발생했습니다:", error);
  }
}

// 테스트 실행
testBusDetailInfo().catch(console.error);
