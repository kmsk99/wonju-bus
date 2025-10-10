import fs from "fs";
import path from "path";
import { Browser, BrowserContext, chromium, Page } from "playwright";

import { BusInfo, BusOperationInfo, BusRouteInfo } from "./types";

const BUS_INFO_URL = "http://its.wonju.go.kr/bus/bus04.do";
const TABLE_SELECTOR =
  "#content > div.sub_inner > div.para.tbl_cont > div > table";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;
const TEXT_CORRECTIONS: Array<[string, string]> = [
  ["한라비디발", "한라비발디"],
];

export interface CrawlerOptions {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  outputDirs?: string[];
  maxRetries?: number;
  throttleMs?: number;
}

export interface CrawlSummary {
  totalRoutes: number;
  successfulRoutes: number;
  failedRoutes: string[];
  outputDirs: string[];
  savedFiles: string[];
}

/**
 * 원주시 버스 정보를 크롤링하는 클래스
 */
export class WonjuBusCrawler {
  private readonly options: CrawlerOptions;
  private readonly outputDirs: string[];
  private readonly maxRetries: number;
  private readonly throttleMs: number;

  constructor(options: CrawlerOptions = {}) {
    const fallbackOutputDir = path.join(process.cwd(), "data");
    const configuredDirs =
      options.outputDirs && options.outputDirs.length > 0
        ? options.outputDirs
        : [fallbackOutputDir];

    this.outputDirs = configuredDirs.map((dir) => path.resolve(dir));
    this.maxRetries = Math.max(1, options.maxRetries ?? DEFAULT_MAX_RETRIES);
    this.throttleMs = Math.max(0, options.throttleMs ?? 0);

    this.options = {
      headless: options.headless ?? true,
      slowMo: options.slowMo ?? 0,
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: this.maxRetries,
      throttleMs: this.throttleMs,
      outputDirs: this.outputDirs,
    };
  }

  /**
   * 모든 버스 노선 정보 요약 목록을 가져옵니다.
   */
  async getBusRouteNumbers(): Promise<BusRouteInfo[]> {
    const { browser, context } = await this.launchBrowser();

    try {
      const page = await context.newPage();

      try {
        const routes = await this.extractRouteNumbers(page);
        const normalizedRoutes = routes.map((route) =>
          this.normalizeRouteInfo(route)
        );
        console.log(`총 ${normalizedRoutes.length}개의 버스 노선을 찾았습니다.`);
        return normalizedRoutes;
      } finally {
        await page.close();
      }
    } finally {
      await context.close();
      await browser.close();
    }
  }

  /**
   * 특정 버스 노선의 상세 정보를 가져옵니다.
   */
  async getBusInfo(busRouteNumber: string): Promise<BusInfo | null> {
    const { browser, context } = await this.launchBrowser();

    try {
      return await this.fetchBusInfoWithContext(
        context,
        busRouteNumber,
        undefined
      );
    } finally {
      await context.close();
      await browser.close();
    }
  }

  /**
   * 모든 버스 노선 정보를 수집하고 JSON 파일로 저장합니다.
   */
  async crawlAllBusInfo(): Promise<CrawlSummary> {
    this.prepareOutputDirs();

    const results: Record<string, BusInfo> = {};
    const savedFiles: string[] = [];
    const failedRoutes: string[] = [];
    let totalRoutes = 0;

    const { browser, context } = await this.launchBrowser();
    try {
      const listPage = await context.newPage();
      let routeInfoList: BusRouteInfo[] = [];

      try {
        const rawRoutes = await this.extractRouteNumbers(listPage);
        routeInfoList = rawRoutes.map((route) => this.normalizeRouteInfo(route));
      } finally {
        await listPage.close();
      }

      totalRoutes = routeInfoList.length;
      console.log(`총 ${totalRoutes}개의 버스 노선 정보를 크롤링합니다...`);

      let completed = 0;
      for (const routeInfo of routeInfoList) {
        completed += 1;

        let busInfo: BusInfo | null = null;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
          busInfo = await this.fetchBusInfoWithContext(
            context,
            routeInfo.routeNumber,
            routeInfo
          );
          if (busInfo) {
            break;
          }

          console.warn(
            `[재시도] ${routeInfo.routeNumber} 노선 ${attempt}차 시도 실패`
          );
          if (attempt < this.maxRetries) {
            await this.delay(Math.max(RETRY_DELAY_MS, this.throttleMs));
          }
        }

        if (busInfo) {
          const normalizedRouteNumber = busInfo.routeInfo.routeNumber;
          results[normalizedRouteNumber] = busInfo;
          const fileName = this.saveBusInfoToJson(
            normalizedRouteNumber,
            busInfo
          );
          savedFiles.push(fileName);

          console.log(
            `[${completed}/${totalRoutes}] ${normalizedRouteNumber} 노선 정보 크롤링 완료`
          );
        } else {
          failedRoutes.push(routeInfo.routeNumber);
          console.error(
            `[${completed}/${totalRoutes}] ${routeInfo.routeNumber} 노선 정보 크롤링 실패`
          );
        }

        if (this.throttleMs > 0) {
          await this.delay(this.throttleMs);
        }
      }
    } finally {
      await context.close();
      await browser.close();
    }

    this.writeAggregatedOutputs(results, savedFiles);

    return {
      totalRoutes,
      successfulRoutes: Object.keys(results).length,
      failedRoutes,
      outputDirs: [...this.outputDirs],
      savedFiles: Array.from(new Set(savedFiles)),
    };
  }

  private async launchBrowser(): Promise<{
    browser: Browser;
    context: BrowserContext;
  }> {
    const browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
    });

    const context = await browser.newContext();
    const timeout = this.options.timeout ?? DEFAULT_TIMEOUT;
    context.setDefaultTimeout(timeout);
    context.setDefaultNavigationTimeout(timeout);

    return { browser, context };
  }

  private async extractRouteNumbers(page: Page): Promise<BusRouteInfo[]> {
    await page.goto(BUS_INFO_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(TABLE_SELECTOR);

    return page.evaluate<BusRouteInfo[], string>((selector) => {
      const rows = document.querySelectorAll<HTMLTableRowElement>(
        `${selector} > tbody > tr`
      );

      return Array.from(rows)
        .map((row) => {
          const cells = row.querySelectorAll<HTMLTableCellElement>("td");
          if (cells.length < 7) {
            return null;
          }

          return {
            routeNumber: cells[0].textContent?.trim() ?? "",
            origin: cells[1].textContent?.trim() ?? "",
            destination: cells[2].textContent?.trim() ?? "",
            firstBusTime: cells[3].textContent?.trim() ?? "",
            lastBusTime: cells[4].textContent?.trim() ?? "",
            operationCount: cells[5].textContent?.trim() ?? "",
            interval: cells[6].textContent?.trim() ?? "",
          };
        })
        .filter(
          (value): value is BusRouteInfo =>
            !!value && value.routeNumber.length > 0
        );
    }, TABLE_SELECTOR);
  }

  private async fetchBusInfoWithContext(
    context: BrowserContext,
    busRouteNumber: string,
    fallbackInfo?: BusRouteInfo
  ): Promise<BusInfo | null> {
    const page = await context.newPage();
    page.setDefaultTimeout(this.options.timeout ?? DEFAULT_TIMEOUT);

    try {
      await page.goto(BUS_INFO_URL, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(TABLE_SELECTOR);

      const routeInfo =
        fallbackInfo && fallbackInfo.routeNumber === busRouteNumber
          ? fallbackInfo
          : await this.extractBasicInfoFromTable(page, busRouteNumber);

      const opened = await this.openRouteDetail(page, busRouteNumber);
      if (!opened) {
        console.error(
          `버스 ${busRouteNumber}번 상세 페이지로 이동하지 못했습니다.`
        );
        return null;
      }

      await page.waitForSelector(TABLE_SELECTOR);
      const operationInfo = await this.extractOperationInfo(page);

      return this.normalizeBusInfo({
        routeInfo,
        operationInfo,
      });
    } catch (error) {
      console.error(`버스 ${busRouteNumber}번 정보 가져오기 실패:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * 목록 테이블에서 해당 버스 노선의 기본 정보를 추출합니다.
   */
  private async extractBasicInfoFromTable(
    page: Page,
    busRouteNumber: string
  ): Promise<BusRouteInfo> {
    return page.evaluate<
      BusRouteInfo,
      { routeNumber: string; selector: string }
    >(
      ({ routeNumber, selector }) => {
        const rows = document.querySelectorAll<HTMLTableRowElement>(
          `${selector} > tbody > tr`
        );

        for (const row of rows) {
          const firstCell = row.querySelector<HTMLTableCellElement>(
            "td:first-child"
          );
          if (firstCell?.textContent?.trim() === routeNumber) {
            const cells = row.querySelectorAll<HTMLTableCellElement>("td");
            if (cells.length >= 7) {
              return {
                routeNumber,
                origin: cells[1].textContent?.trim() ?? "",
                destination: cells[2].textContent?.trim() ?? "",
                firstBusTime: cells[3].textContent?.trim() ?? "",
                lastBusTime: cells[4].textContent?.trim() ?? "",
                operationCount: cells[5].textContent?.trim() ?? "",
                interval: cells[6].textContent?.trim() ?? "",
              };
            }
          }
        }

        return {
          routeNumber,
          origin: "",
          destination: "",
          firstBusTime: "",
          lastBusTime: "",
          operationCount: "",
          interval: "",
        };
      },
      { routeNumber: busRouteNumber, selector: TABLE_SELECTOR }
    );
  }

  /**
   * 상세 페이지로 이동하기 위해 해당 노선 행을 클릭합니다.
   */
  private async openRouteDetail(
    page: Page,
    busRouteNumber: string
  ): Promise<boolean> {
    return page.evaluate<
      boolean,
      { routeNumber: string; selector: string }
    >(
      ({ routeNumber, selector }) => {
        const rows = document.querySelectorAll<HTMLTableRowElement>(
          `${selector} > tbody > tr`
        );

        for (const row of rows) {
          const firstCell = row.querySelector<HTMLTableCellElement>(
            "td:first-child"
          );
          if (firstCell?.textContent?.trim() === routeNumber) {
            const clickableCell =
              (row.querySelector("td[onclick]") as HTMLElement | null) ??
              (firstCell as HTMLElement | null);

            if (clickableCell) {
              clickableCell.click();
              return true;
            }
          }
        }

        return false;
      },
      { routeNumber: busRouteNumber, selector: TABLE_SELECTOR }
    );
  }

  /**
   * 버스 운행 정보를 추출합니다.
   */
  private async extractOperationInfo(page: Page): Promise<BusOperationInfo[]> {
    return page.evaluate<BusOperationInfo[], string>((selector) => {
      const table = document.querySelector(selector);
      if (!table) {
        return [];
      }

      const headerCells = table.querySelectorAll("thead > tr > th");
      const headerNames = Array.from(headerCells).map(
        (cell) => cell.textContent?.trim() ?? ""
      );

      if (headerNames.length < 3) {
        return [];
      }

      const operationNumberIdx = 0;
      let departureIdx = -1;
      let arrivalIdx = -1;

      headerNames.forEach((header, index) => {
        if (index === 0) {
          return;
        }

        if (header.includes("발")) {
          if (departureIdx === -1) {
            departureIdx = index;
          } else if (arrivalIdx === -1) {
            arrivalIdx = index;
          }
        }
      });

      if (departureIdx === -1) departureIdx = 1;
      if (arrivalIdx === -1) arrivalIdx = 2;

      const departureLabel =
        headerNames[departureIdx]?.replace("발", "").trim() || "출발지";
      const arrivalLabel =
        headerNames[arrivalIdx]?.replace("발", "").trim() || "도착지";

      const categoryIdx = Math.min(3, headerNames.length - 2);
      const noteIdx = Math.min(4, headerNames.length - 1);

      const rows = table.querySelectorAll("tbody > tr");

      return Array.from(rows)
        .map((row) => {
          const cells = row.querySelectorAll<HTMLTableCellElement>("td");

          if (cells.length <= arrivalIdx) {
            return null;
          }

          const operationNumber =
            cells[operationNumberIdx]?.textContent?.trim() ?? "";
          const departureTime =
            cells[departureIdx]?.textContent?.trim() ?? "";
          const arrivalTime = cells[arrivalIdx]?.textContent?.trim() ?? "";

          if (!operationNumber || (!departureTime && !arrivalTime)) {
            return null;
          }

          return {
            operationNumber,
            departureTime,
            arrivalTime,
            departureName: departureLabel,
            arrivalName: arrivalLabel,
            category: cells[categoryIdx]?.textContent?.trim() ?? "",
            note: cells[noteIdx]?.textContent?.trim() ?? "",
          };
        })
        .filter(
          (value): value is BusOperationInfo =>
            value !== null && !!value.operationNumber
        );
    }, TABLE_SELECTOR);
  }

  private prepareOutputDirs(): void {
    for (const dir of this.outputDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        continue;
      }

      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (
          (entry.startsWith("wonju-bus") && entry.endsWith(".json")) ||
          entry === "bus-files.json"
        ) {
          fs.unlinkSync(path.join(dir, entry));
        }
      }
    }
  }

  private saveBusInfoToJson(routeNumber: string, busInfo: BusInfo): string {
    const fileName = this.buildRouteFileName(routeNumber);
    const payload = JSON.stringify(busInfo, null, 2);

    for (const dir of this.outputDirs) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, fileName), payload, "utf-8");
    }

    return fileName;
  }

  private writeAggregatedOutputs(
    results: Record<string, BusInfo>,
    savedFiles: string[]
  ): void {
    const uniqueFiles = Array.from(new Set(savedFiles)).sort((a, b) =>
      a.localeCompare(b, "ko")
    );

    this.writeJsonToOutputs("wonju-bus-info.json", results);
    this.writeJsonToOutputs("bus-files.json", uniqueFiles);
  }

  private writeJsonToOutputs(fileName: string, data: unknown): void {
    const payload = JSON.stringify(data, null, 2);

    for (const dir of this.outputDirs) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, fileName), payload, "utf-8");
    }
  }

  private normalizeBusInfo(busInfo: BusInfo): BusInfo {
    return {
      routeInfo: this.normalizeRouteInfo(busInfo.routeInfo),
      operationInfo: this.normalizeOperationInfo(busInfo.operationInfo),
    };
  }

  private normalizeRouteInfo(routeInfo: BusRouteInfo): BusRouteInfo {
    return {
      ...routeInfo,
      routeNumber: this.normalizeValue(routeInfo.routeNumber),
      origin: this.normalizeValue(routeInfo.origin),
      destination: this.normalizeValue(routeInfo.destination),
      firstBusTime: this.normalizeValue(routeInfo.firstBusTime),
      lastBusTime: this.normalizeValue(routeInfo.lastBusTime),
      operationCount: this.normalizeValue(routeInfo.operationCount),
      interval: this.normalizeValue(routeInfo.interval),
    };
  }

  private normalizeOperationInfo(
    operationInfo: BusOperationInfo[]
  ): BusOperationInfo[] {
    return operationInfo.map((info) => ({
      ...info,
      operationNumber: this.normalizeValue(info.operationNumber),
      departureTime: this.normalizeValue(info.departureTime),
      arrivalTime: this.normalizeValue(info.arrivalTime),
      departureName: this.normalizeValue(info.departureName),
      arrivalName: this.normalizeValue(info.arrivalName),
      category: this.normalizeValue(info.category),
      note: this.normalizeValue(info.note),
    }));
  }

  private normalizeValue(value: string | null | undefined): string {
    if (!value) {
      return "";
    }

    let normalized = value.trim();
    for (const [wrong, correct] of TEXT_CORRECTIONS) {
      normalized = normalized.split(wrong).join(correct);
    }

    return normalized;
  }

  private buildRouteFileName(routeNumber: string): string {
    const normalizedRoute = this.normalizeValue(routeNumber);
    const safeRouteNumber = normalizedRoute.replace(/[/\\?%*:|"<>]/g, "-");
    return `wonju-bus-${safeRouteNumber}.json`;
  }

  private async delay(durationMs: number): Promise<void> {
    if (durationMs <= 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, durationMs));
  }
}
