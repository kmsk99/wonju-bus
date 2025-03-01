import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

import { BusData } from "@/entities/bus/model/types";
import { extractTerminals } from "@/shared/lib/utils/bus-time";

/**
 * 파일 시스템에서 모든 버스 노선 데이터 파일을 읽어옵니다.
 */
async function getAllBusData(): Promise<BusData[]> {
  const dataDir = path.join(process.cwd(), "data");

  try {
    // 디렉토리 내 모든 파일 목록 가져오기
    const files = await fs.readdir(dataDir);

    // 버스 데이터 파일만 필터링
    const busFiles = files.filter(
      (file) => file.startsWith("wonju-bus-") && file.endsWith(".json")
    );

    // 모든 파일 내용 읽기
    const busDataPromises = busFiles.map(async (file) => {
      const filePath = path.join(dataDir, file);
      const fileContents = await fs.readFile(filePath, "utf8");
      return JSON.parse(fileContents) as BusData;
    });

    return await Promise.all(busDataPromises);
  } catch (error) {
    console.error("버스 데이터 로드 오류:", error);
    return [];
  }
}

/**
 * 모든 종점 목록 API 핸들러
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 모든 버스 데이터 로드
    const busDataList = await getAllBusData();

    if (busDataList.length === 0) {
      return NextResponse.json(
        { error: "버스 데이터를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 모든 종점 추출 (중복 제거)
    const terminals = extractTerminals(busDataList);

    return NextResponse.json(terminals);
  } catch (error) {
    console.error("종점 목록 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
