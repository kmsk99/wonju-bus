import { WonjuBusCrawler } from "./busCrawler";

async function main() {
  console.log("원주시 버스 정보 크롤링을 시작합니다...");

  const crawler = new WonjuBusCrawler();

  try {
    // 모든 버스 정보 수집
    await crawler.crawlAllBusInfo();

    // 원하는 경우 특정 버스 노선만 수집할 수도 있습니다
    // const busInfo = await crawler.getBusInfo('2');
    // console.log(JSON.stringify(busInfo, null, 2));
  } catch (error) {
    console.error("크롤링 중 오류가 발생했습니다:", error);
  }
}

// 프로그램 실행
main().catch(console.error);
