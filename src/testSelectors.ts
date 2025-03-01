import { chromium } from "playwright";
import readline from "readline";

// 원주시 버스 정보 URL
const BUS_INFO_URL = "http://its.wonju.go.kr/bus/bus04.do";

/**
 * 셀렉터 테스트를 위한 인터랙티브 스크립트
 */
async function testSelectors() {
  console.log("원주시 버스 정보 사이트 셀렉터 테스트를 시작합니다...");

  // 브라우저 실행 (헤드리스 모드 끄고, 느린 모션 활성화)
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 타임아웃 설정
  page.setDefaultTimeout(60000);

  // 사용자 입력을 위한 인터페이스 설정
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // 기본 페이지로 이동
  await page.goto(BUS_INFO_URL);
  console.log("원주시 버스 정보 사이트로 이동했습니다.");

  let continueRun = true;

  while (continueRun) {
    const command = await promptForInput(
      rl,
      "\n명령어를 입력하세요 (help, goto, click, test, waitfor, count, exit): "
    );

    try {
      switch (command.toLowerCase()) {
        case "help":
          showHelp();
          break;

        case "goto":
          const url = await promptForInput(
            rl,
            "이동할 URL을 입력하세요 (기본값: " + BUS_INFO_URL + "): "
          );
          await page.goto(url || BUS_INFO_URL);
          console.log(`페이지 이동: ${url || BUS_INFO_URL}`);
          break;

        case "click":
          const clickSelector = await promptForInput(
            rl,
            "클릭할 요소의 셀렉터를 입력하세요: "
          );
          if (clickSelector) {
            const count = await page.locator(clickSelector).count();
            if (count > 0) {
              await page.click(clickSelector);
              console.log(
                `셀렉터 '${clickSelector}'에 일치하는 요소를 클릭했습니다.`
              );
            } else {
              console.log(
                `셀렉터 '${clickSelector}'에 일치하는 요소를 찾을 수 없습니다.`
              );
            }
          }
          break;

        case "test":
          const testSelector = await promptForInput(
            rl,
            "테스트할 셀렉터를 입력하세요: "
          );
          if (testSelector) {
            const count = await page.locator(testSelector).count();
            console.log(
              `셀렉터 '${testSelector}'에 일치하는 요소 수: ${count}`
            );

            if (count > 0) {
              const textContent = await page
                .locator(testSelector)
                .first()
                .textContent();
              console.log(`첫 번째 일치 요소의 텍스트: ${textContent}`);

              // 요소의 속성들 표시
              const attributes = await page.evaluate((selector) => {
                const el = document.querySelector(selector);
                if (!el) return {};

                const result: Record<string, string> = {};
                for (const attr of el.attributes) {
                  result[attr.name] = attr.value;
                }
                return result;
              }, testSelector);

              console.log("요소 속성:", attributes);
            }
          }
          break;

        case "waitfor":
          const waitSelector = await promptForInput(
            rl,
            "기다릴 요소의 셀렉터를 입력하세요: "
          );
          if (waitSelector) {
            console.log(`셀렉터 '${waitSelector}'를 기다리는 중...`);
            await page.waitForSelector(waitSelector, { timeout: 10000 });
            console.log(`셀렉터 '${waitSelector}'가 나타났습니다.`);
          }
          break;

        case "count":
          const countSelector = await promptForInput(
            rl,
            "개수를 셀 요소의 셀렉터를 입력하세요: "
          );
          if (countSelector) {
            const count = await page.locator(countSelector).count();
            console.log(
              `셀렉터 '${countSelector}'에 일치하는 요소 수: ${count}`
            );

            if (count > 0) {
              // 처음 10개 요소의 텍스트 출력
              const displayCount = Math.min(count, 10);
              for (let i = 0; i < displayCount; i++) {
                const text = await page
                  .locator(countSelector)
                  .nth(i)
                  .textContent();
                console.log(`[${i}] ${text?.trim()}`);
              }

              if (count > 10) {
                console.log(`...외 ${count - 10}개 더 있음`);
              }
            }
          }
          break;

        case "exit":
          continueRun = false;
          console.log("프로그램을 종료합니다...");
          break;

        default:
          console.log(
            "알 수 없는 명령어입니다. 'help'를 입력하여 도움말을 확인하세요."
          );
      }
    } catch (error) {
      console.error("오류 발생:", error);
    }
  }

  // 종료 정리
  rl.close();
  await browser.close();
  console.log("브라우저가 종료되었습니다.");
}

/**
 * 사용자에게 입력 프롬프트를 표시하고 입력을 받는 함수
 */
function promptForInput(
  rl: readline.Interface,
  prompt: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * 도움말 표시
 */
function showHelp() {
  console.log("\n===== 셀렉터 테스트 도구 도움말 =====");
  console.log("help   : 이 도움말을 표시합니다.");
  console.log("goto   : 지정한 URL로 이동합니다.");
  console.log("click  : 지정한 셀렉터의 요소를 클릭합니다.");
  console.log(
    "test   : 셀렉터가 페이지에 존재하는지 테스트하고 정보를 표시합니다."
  );
  console.log("waitfor: 셀렉터가 페이지에 나타날 때까지 기다립니다.");
  console.log("count  : 셀렉터에 일치하는 요소 수를 세고 텍스트를 표시합니다.");
  console.log("exit   : 프로그램을 종료합니다.");
  console.log("===============================");
}

// 셀렉터 테스트 실행
testSelectors().catch(console.error);
