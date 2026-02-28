import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

import { BusInfo, BusOperationInfo, BusRouteInfo } from "./types";

const BUS_INFO_URL = "http://its.wonju.go.kr/bus/bus04.do";
const BUS_DETAIL_URL = "http://its.wonju.go.kr/bus/bus04Detail.do";
const TABLE_SELECTOR =
  "#content > div.sub_inner > div.para.tbl_cont > div > table";
const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;
const TEXT_CORRECTIONS: Array<[string, string]> = [
  ["한라비디발", "한라비발디"],
];

export interface CrawlerOptions {
  /** @deprecated Playwright 제거로 더 이상 사용하지 않습니다 */
  headless?: boolean;
  /** @deprecated Playwright 제거로 더 이상 사용하지 않습니다 */
  slowMo?: number;
  /** @deprecated Playwright 제거로 더 이상 사용하지 않습니다 */
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

export class WonjuBusCrawler {
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
  }

  async getBusRouteNumbers(): Promise<BusRouteInfo[]> {
    const routes = await this.extractRouteNumbers();
    const normalizedRoutes = routes.map((route) =>
      this.normalizeRouteInfo(route)
    );
    console.log(`총 ${normalizedRoutes.length}개의 버스 노선을 찾았습니다.`);
    return normalizedRoutes;
  }

  async getBusInfo(busRouteNumber: string): Promise<BusInfo | null> {
    const routes = await this.extractRouteNumbers();
    const fallbackInfo = routes.find(
      (r) => r.routeNumber === busRouteNumber
    );
    return this.fetchBusDetail(busRouteNumber, fallbackInfo);
  }

  async crawlAllBusInfo(): Promise<CrawlSummary> {
    this.prepareOutputDirs();

    const results: Record<string, BusInfo> = {};
    const savedFiles: string[] = [];
    const failedRoutes: string[] = [];

    const rawRoutes = await this.extractRouteNumbers();
    const routeInfoList = rawRoutes.map((route) =>
      this.normalizeRouteInfo(route)
    );
    const totalRoutes = routeInfoList.length;
    console.log(`총 ${totalRoutes}개의 버스 노선 정보를 크롤링합니다...`);

    let completed = 0;
    for (const routeInfo of routeInfoList) {
      completed += 1;

      let busInfo: BusInfo | null = null;
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        busInfo = await this.fetchBusDetail(
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

    this.writeAggregatedOutputs(results, savedFiles);

    return {
      totalRoutes,
      successfulRoutes: Object.keys(results).length,
      failedRoutes,
      outputDirs: [...this.outputDirs],
      savedFiles: Array.from(new Set(savedFiles)),
    };
  }

  private async extractRouteNumbers(): Promise<BusRouteInfo[]> {
    const res = await fetch(BUS_INFO_URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    const routes: BusRouteInfo[] = [];

    $(`${TABLE_SELECTOR} > tbody > tr`).each((_i, row) => {
      const cells = $(row).find("td");
      if (cells.length < 7) return;

      routes.push({
        routeNumber: $(cells[0]).text().trim(),
        origin: $(cells[1]).text().trim(),
        destination: $(cells[2]).text().trim(),
        firstBusTime: $(cells[3]).text().trim(),
        lastBusTime: $(cells[4]).text().trim(),
        operationCount: $(cells[5]).text().trim(),
        interval: $(cells[6]).text().trim(),
      });
    });

    return routes.filter((r) => r.routeNumber.length > 0);
  }

  private async fetchBusDetail(
    busRouteNumber: string,
    fallbackInfo?: BusRouteInfo
  ): Promise<BusInfo | null> {
    try {
      const res = await fetch(BUS_DETAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `no=${encodeURIComponent(busRouteNumber)}`,
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      const routeInfo: BusRouteInfo = fallbackInfo ?? {
        routeNumber: busRouteNumber,
        origin: "",
        destination: "",
        firstBusTime: "",
        lastBusTime: "",
        operationCount: "",
        interval: "",
      };

      const operationInfo = this.parseOperationTable($);

      return this.normalizeBusInfo({ routeInfo, operationInfo });
    } catch (error) {
      console.error(`버스 ${busRouteNumber}번 정보 가져오기 실패:`, error);
      return null;
    }
  }

  private parseOperationTable($: cheerio.CheerioAPI): BusOperationInfo[] {
    const table = $(TABLE_SELECTOR);
    if (table.length === 0) return [];

    const headerCells = table.find("thead > tr > th");
    const headerNames = headerCells.map((_i, el) => $(el).text().trim()).get();

    if (headerNames.length < 3) return [];

    let departureIdx = -1;
    let arrivalIdx = -1;

    headerNames.forEach((header, index) => {
      if (index === 0) return;
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

    const results: BusOperationInfo[] = [];

    table.find("tbody > tr").each((_i, row) => {
      const cells = $(row).find("td");
      if (cells.length <= arrivalIdx) return;

      const operationNumber = $(cells[0]).text().trim();
      const departureTime = $(cells[departureIdx]).text().trim();
      const arrivalTime = $(cells[arrivalIdx]).text().trim();

      if (!operationNumber || (!departureTime && !arrivalTime)) return;

      results.push({
        operationNumber,
        departureTime,
        arrivalTime,
        departureName: departureLabel,
        arrivalName: arrivalLabel,
        category: $(cells[categoryIdx]).text().trim(),
        note: $(cells[noteIdx]).text().trim(),
      });
    });

    return results;
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
    if (!value) return "";

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
    if (durationMs <= 0) return;
    await new Promise((resolve) => setTimeout(resolve, durationMs));
  }
}
