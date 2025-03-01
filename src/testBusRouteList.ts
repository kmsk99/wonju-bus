import { chromium } from "playwright";

// 원주시 버스 정보 URL
const BUS_INFO_URL = "http://its.wonju.go.kr/bus/bus04.do";

/**
 * 테이블에서 버스 노선 목록을 가져오는 테스트
 */
async function testBusRouteList() {
  console.log("원주시 버스 노선 목록 테스트를 시작합니다...");

  // 브라우저 실행 (UI 모드로 확인하기 위해)
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 버스 정보 페이지 로드
    await page.goto(BUS_INFO_URL);
    console.log("버스 정보 페이지로 이동했습니다.");

    // 테이블이 로드될 때까지 대기
    await page.waitForSelector(
      "#content > div.sub_inner > div.para.tbl_cont > div > table"
    );
    console.log("버스 노선 테이블을 찾았습니다.");

    // 테이블에서 모든 행 가져오기
    const rows = await page
      .locator(
        "#content > div.sub_inner > div.para.tbl_cont > div > table > tbody > tr"
      )
      .count();
    console.log(`테이블에서 총 ${rows}개의 행을 찾았습니다.`);

    // 첫 10개 노선 정보만 출력
    const displayCount = Math.min(rows, 10);
    console.log(`\n첫 ${displayCount}개 버스 노선 정보:`);

    for (let i = 0; i < displayCount; i++) {
      const rowSelector = `#content > div.sub_inner > div.para.tbl_cont > div > table > tbody > tr:nth-child(${
        i + 1
      })`;

      // 노선번호(첫 번째 셀) 가져오기
      const routeNumber = await page
        .locator(`${rowSelector} > td:nth-child(1)`)
        .textContent();

      // onclick 속성 확인
      const onclickAttr = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        return el ? el.getAttribute("onclick") : null;
      }, `${rowSelector} > td:nth-child(1)`);

      // 출발지와 도착지
      const origin = await page
        .locator(`${rowSelector} > td:nth-child(2)`)
        .textContent();
      const destination = await page
        .locator(`${rowSelector} > td:nth-child(3)`)
        .textContent();

      console.log(`[${i + 1}] 노선번호: ${routeNumber?.trim()}`);
      console.log(`    onclick 속성: ${onclickAttr}`);
      console.log(`    운행구간: ${origin?.trim()} - ${destination?.trim()}`);
      console.log("-----------------------------");
    }

    // 특정 노선 테스트
    if (rows > 0) {
      console.log("\n특정 노선 셀렉터 테스트:");
      const testRouteNumber = "2(평일)";
      const selector = `td[onclick*="goDetail('${testRouteNumber}')"]`;

      const exists = (await page.locator(selector).count()) > 0;
      console.log(
        `'${testRouteNumber}'에 대한 셀렉터 '${selector}' 존재 여부: ${
          exists ? "있음" : "없음"
        }`
      );

      if (exists) {
        const routeElement = await page.locator(selector).first();
        const text = await routeElement.textContent();
        console.log(`셀렉터로 찾은 텍스트: ${text}`);

        console.log("클릭 테스트를 실행합니다...");
        await routeElement.click();

        console.log("상세 정보 페이지 로드 확인 중...");
        await page.waitForSelector(".btbl01");
        console.log("상세 정보 페이지가 로드되었습니다!");
      }
    }

    // 10초간 결과 확인을 위해 대기
    console.log("\n10초 후 브라우저가 종료됩니다...");
    await new Promise((r) => setTimeout(r, 10000));
  } finally {
    await browser.close();
    console.log("테스트가 완료되었습니다.");
  }
}

// 테스트 실행
testBusRouteList().catch(console.error);
