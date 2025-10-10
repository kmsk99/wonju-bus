import { chromium } from "playwright";

// 원주시 버스 정보 URL
const BUS_INFO_URL = "http://its.wonju.go.kr/bus/bus04.do";

/**
 * Playwright Inspector를 사용하여 테스트하는 스크립트
 *
 * 실행 방법:
 * PWDEBUG=1 pnpm ts-node src/inspectorTest.ts
 */
async function inspectorTest() {
  console.log("Playwright Inspector를 사용하여 테스트를 시작합니다...");
  console.log(
    "Inspector가 활성화되지 않았다면, 환경 변수 PWDEBUG=1을 설정하세요."
  );
  console.log("예: PWDEBUG=1 pnpm ts-node src/inspectorTest.ts");

  // 브라우저 실행
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 메인 페이지로 이동
    await page.goto(BUS_INFO_URL);
    console.log("원주시 버스 정보 페이지로 이동했습니다.");

    // 서브 메뉴 대기
    await page.waitForSelector(".sub_menu_dep3");
    console.log("서브 메뉴가 로드되었습니다.");

    // 2번 버스 링크 찾기
    const busSelector = ".sub_menu_dep3 li a:text-is('2')";
    await page.waitForSelector(busSelector);
    console.log("2번 버스 링크를 찾았습니다.");

    // 2번 버스 링크 클릭
    await page.click(busSelector);
    console.log("2번 버스 링크를 클릭했습니다.");

    // 버스 정보 테이블 대기
    await page.waitForSelector(".btbl01");
    console.log("버스 정보 테이블이 로드되었습니다.");

    // 버스 기본 정보 추출
    const routeInfo = await page.evaluate(() => {
      const table = document.querySelector(".btbl01");
      if (!table) return null;

      const rows = table.querySelectorAll("tr");
      if (rows.length < 2) return null;

      const cells = rows[1].querySelectorAll("td");

      return {
        routeNumber: "2",
        origin: cells[1]?.textContent?.trim() || "",
        destination: cells[2]?.textContent?.trim() || "",
        firstBusTime: cells[3]?.textContent?.trim() || "",
        lastBusTime: cells[4]?.textContent?.trim() || "",
        operationCount: cells[5]?.textContent?.trim() || "",
        interval: cells[6]?.textContent?.trim() || "",
      };
    });

    console.log("버스 기본 정보:", routeInfo);

    // 운행 정보 테이블 확인
    const operationInfoCount = await page.evaluate(() => {
      const tables = document.querySelectorAll(".btbl01");
      if (tables.length < 2) return 0;

      const operationTable = tables[1];
      const rows = operationTable.querySelectorAll("tr");

      // 첫 번째 행은 헤더이므로 제외
      return rows.length - 1;
    });

    console.log(`운행 정보 수: ${operationInfoCount}개`);

    // 페이지에서 자유롭게 테스트할 수 있도록 10분간 대기
    console.log(
      "\n이제 Inspector를 통해 자유롭게 페이지를 테스트할 수 있습니다."
    );
    console.log("10분 후 자동으로 종료됩니다.");

    // 10분간 대기
    await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000));
  } finally {
    await browser.close();
    console.log("테스트가 종료되었습니다.");
  }
}

// 실행
inspectorTest().catch(console.error);
