import fs from "fs";
import path from "path";
import { chromium, Page } from "playwright";

import { BusInfo, BusOperationInfo, BusRouteInfo } from "./types";

// 원주시 버스 정보 URL
const BUS_INFO_URL = "http://its.wonju.go.kr/bus/bus04.do";

// 크롤러 옵션 타입
export interface CrawlerOptions {
  headless?: boolean; // 헤드리스 모드 여부
  slowMo?: number; // 느린 모션 (ms)
  timeout?: number; // 타임아웃 (ms)
}

// 기본 옵션
const DEFAULT_OPTIONS: CrawlerOptions = {
  headless: true,
  slowMo: 0,
  timeout: 30000,
};

/**
 * 원주시 버스 정보를 크롤링하는 클래스
 */
export class WonjuBusCrawler {
  private options: CrawlerOptions;

  constructor(options: CrawlerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 모든 버스 노선 정보 요약 목록을 가져옵니다.
   */
  async getBusRouteNumbers(): Promise<BusRouteInfo[]> {
    const browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(BUS_INFO_URL);

    // 페이지 로드 기다리기 - 테이블이 나타날 때까지 대기
    await page.waitForSelector(
      "#content > div.sub_inner > div.para.tbl_cont > div > table"
    );

    // 버스 노선 정보 추출 - 테이블에서 모든 정보를 한 번에 추출
    const routeInfoList = await page.evaluate(() => {
      // 테이블의 모든 행을 선택
      const rows = document.querySelectorAll(
        "#content > div.sub_inner > div.para.tbl_cont > div > table > tbody > tr"
      );
      const routeInfos: Array<{
        routeNumber: string;
        origin: string;
        destination: string;
        firstBusTime: string;
        lastBusTime: string;
        operationCount: string;
        interval: string;
      }> = [];

      // 각 행에서 모든 셀 데이터 추출
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 7) {
          routeInfos.push({
            routeNumber: cells[0].textContent?.trim() || "",
            origin: cells[1].textContent?.trim() || "",
            destination: cells[2].textContent?.trim() || "",
            firstBusTime: cells[3].textContent?.trim() || "",
            lastBusTime: cells[4].textContent?.trim() || "",
            operationCount: cells[5].textContent?.trim() || "",
            interval: cells[6].textContent?.trim() || "",
          });
        }
      });

      return routeInfos;
    });

    await browser.close();

    console.log(`총 ${routeInfoList.length}개의 버스 노선을 찾았습니다.`);
    return routeInfoList;
  }

  /**
   * 특정 버스 노선의 상세 정보를 가져옵니다.
   */
  async getBusInfo(busRouteNumber: string): Promise<BusInfo | null> {
    console.log(`버스 ${busRouteNumber}번 정보를 가져오는 중...`);

    // 슬래시(/) 또는 괄호( ( ) )가 포함된 경우 처리
    const encodedRouteNumber =
      busRouteNumber.includes("/") ||
      busRouteNumber.includes("(") ||
      busRouteNumber.includes(")")
        ? encodeURIComponent(busRouteNumber)
        : busRouteNumber;

    const browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 타임아웃 설정
    page.setDefaultTimeout(this.options.timeout || 30000);

    try {
      // 버스 정보 페이지로 이동
      await page.goto(BUS_INFO_URL);

      // 버스 노선 목록에서 해당 노선 찾기
      await page.waitForSelector(
        "#content > div.sub_inner > div.para.tbl_cont > div > table"
      );

      // onclick 속성을 이용하여 해당 노선 클릭
      const routeSelector = `td[onclick*="goDetail('${busRouteNumber}')"]`;
      await page.waitForSelector(routeSelector);

      // 먼저 이 노선의 기본 정보를 테이블에서 추출해둡니다
      const basicInfo = await this.extractBasicInfoFromTable(
        page,
        busRouteNumber
      );

      // 노선 클릭하여 상세 페이지로 이동
      await page.click(routeSelector);

      // 상세 페이지 로드 기다리기 - 수정된 셀렉터 사용
      await page.waitForSelector(
        "#content > div.sub_inner > div.para.tbl_cont > div > table"
      );

      // 버스 운행 정보 추출
      const operationInfo = await this.extractOperationInfo(page);

      await browser.close();

      return {
        routeInfo: basicInfo,
        operationInfo,
      };
    } catch (error) {
      console.error(`버스 ${busRouteNumber}번 정보 가져오기 실패:`, error);
      await browser.close();
      return null;
    }
  }

  /**
   * 목록 테이블에서 해당 버스 노선의 기본 정보를 추출합니다.
   */
  private async extractBasicInfoFromTable(
    page: Page,
    busRouteNumber: string
  ): Promise<BusRouteInfo> {
    // 해당 노선의 행을 찾아 기본 정보를 추출합니다
    return await page.evaluate((routeNumber) => {
      // 해당 노선의 행 찾기
      const rows = document.querySelectorAll(
        "#content > div.sub_inner > div.para.tbl_cont > div > table > tbody > tr"
      );

      for (const row of rows) {
        const firstCell = row.querySelector("td:first-child");
        if (firstCell && firstCell.textContent?.trim() === routeNumber) {
          const cells = row.querySelectorAll("td");
          if (cells.length >= 7) {
            return {
              routeNumber: routeNumber,
              origin: cells[1].textContent?.trim() || "",
              destination: cells[2].textContent?.trim() || "",
              firstBusTime: cells[3].textContent?.trim() || "",
              lastBusTime: cells[4].textContent?.trim() || "",
              operationCount: cells[5].textContent?.trim() || "",
              interval: cells[6].textContent?.trim() || "",
            };
          }
        }
      }

      // 노선을 찾지 못한 경우 기본값 반환
      return {
        routeNumber: routeNumber,
        origin: "",
        destination: "",
        firstBusTime: "",
        lastBusTime: "",
        operationCount: "",
        interval: "",
      };
    }, busRouteNumber);
  }

  /**
   * 버스 운행 정보를 추출합니다.
   */
  private async extractOperationInfo(page: Page): Promise<BusOperationInfo[]> {
    return await page.evaluate(() => {
      // 테이블 선택
      const table = document.querySelector(
        "#content > div.sub_inner > div.para.tbl_cont > div > table"
      );
      if (!table) return [];

      // 헤더 정보 추출 (thead에서)
      const headerCells = table.querySelectorAll("thead > tr > th");

      if (headerCells.length < 3) {
        console.log("올바른 헤더를 찾을 수 없습니다.");
        return [];
      }

      const headerNames: string[] = [];
      for (let i = 0; i < headerCells.length; i++) {
        headerNames.push(headerCells[i].textContent?.trim() || `열${i + 1}`);
      }

      console.log("추출된 헤더:", headerNames.join(", "));

      // 인덱스 결정 (헤더 기반)
      const operationNumberIdx = 0; // 항상 첫 번째 열은 운행순번

      // 각 열의 역할 파악 - '발'이라는 단어를 포함하는 열 찾기
      let departureIdx = -1;
      let arrivalIdx = -1;
      let departureLabel = "";
      let arrivalLabel = "";

      for (let i = 1; i < headerNames.length; i++) {
        if (headerNames[i].includes("발")) {
          if (departureIdx === -1) {
            departureIdx = i;
            departureLabel = headerNames[i].replace("발", "").trim();
          } else if (arrivalIdx === -1) {
            arrivalIdx = i;
            arrivalLabel = headerNames[i].replace("발", "").trim();
            break;
          }
        }
      }

      // 인덱스가 제대로 설정되지 않은 경우 기본값 사용
      if (departureIdx === -1) departureIdx = 1;
      if (arrivalIdx === -1) arrivalIdx = 2;
      if (!departureLabel)
        departureLabel =
          headerNames[departureIdx].replace("발", "").trim() || "출발지";
      if (!arrivalLabel)
        arrivalLabel =
          headerNames[arrivalIdx].replace("발", "").trim() || "도착지";

      // 구분과 비고 열 인덱스
      const categoryIdx = Math.min(3, headerNames.length - 2);
      const noteIdx = Math.min(4, headerNames.length - 1);

      // 실제 데이터 추출 (tbody에서)
      const rows = table.querySelectorAll("tbody > tr");
      if (rows.length === 0) {
        console.log("데이터 행을 찾을 수 없습니다.");
        return [];
      }

      const operationInfoList: Array<{
        operationNumber: string;
        departureTime: string;
        arrivalTime: string;
        departureName: string;
        arrivalName: string;
        category: string;
        note: string;
      }> = [];

      // 행별로 데이터 추출 및 가공
      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll("td");

        if (cells.length >= 3) {
          const info = {
            operationNumber:
              cells[operationNumberIdx]?.textContent?.trim() || "",
            departureTime: cells[departureIdx]?.textContent?.trim() || "",
            arrivalTime: cells[arrivalIdx]?.textContent?.trim() || "",
            departureName: departureLabel,
            arrivalName: arrivalLabel,
            category: cells[categoryIdx]?.textContent?.trim() || "",
            note: cells[noteIdx]?.textContent?.trim() || "",
          };

          // 유효한 데이터만 추가
          if (
            info.operationNumber &&
            (info.departureTime || info.arrivalTime)
          ) {
            operationInfoList.push(info);
          }
        }
      }

      return operationInfoList;
    });
  }

  /**
   * 모든 버스 노선 정보를 수집하고 JSON 파일로 저장합니다.
   */
  async crawlAllBusInfo(): Promise<void> {
    try {
      // 모든 버스 노선 정보 목록 가져오기
      const routeInfoList = await this.getBusRouteNumbers();
      const results: Record<string, BusInfo> = {};
      let totalRoutes = routeInfoList.length;
      let completedRoutes = 0;

      console.log(`총 ${totalRoutes}개의 버스 노선 정보를 크롤링합니다...`);

      // 각 버스 노선의 상세 정보 가져오기
      for (const routeInfo of routeInfoList) {
        const routeNumber = routeInfo.routeNumber;
        const busInfo = await this.getBusInfo(routeNumber);
        completedRoutes++;

        if (busInfo) {
          results[routeNumber] = busInfo;
          console.log(
            `[${completedRoutes}/${totalRoutes}] ${routeNumber} 노선 정보 크롤링 완료`
          );

          // 개별 노선 정보도 따로 저장
          this.saveBusInfoToJson(routeNumber, busInfo);
        } else {
          console.log(
            `[${completedRoutes}/${totalRoutes}] ${routeNumber} 노선 정보 크롤링 실패`
          );
        }
      }

      // 결과를 JSON 파일로 저장
      const outputDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, "wonju-bus-info.json");
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");

      console.log(`크롤링 완료! 전체 데이터가 저장된 위치: ${outputPath}`);
    } catch (error) {
      console.error("버스 정보 크롤링 중 오류 발생:", error);
    }
  }

  /**
   * 개별 버스 노선 정보를 JSON 파일로 저장합니다.
   */
  private saveBusInfoToJson(routeNumber: string, busInfo: BusInfo): void {
    try {
      const safeRouteNumber = routeNumber.replace(/[/\\?%*:|"<>]/g, "-");
      const outputDir = path.join(process.cwd(), "data");

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(
        outputDir,
        `wonju-bus-${safeRouteNumber}.json`
      );
      fs.writeFileSync(outputPath, JSON.stringify(busInfo, null, 2), "utf-8");

      console.log(`${routeNumber} 노선 정보가 저장된 위치: ${outputPath}`);
    } catch (error) {
      console.error(`${routeNumber} 노선 정보 저장 중 오류 발생:`, error);
    }
  }
}
