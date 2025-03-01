import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

import { BusData } from "@/entities/bus/model/types";

/**
 * 버스 노선 데이터 API 핸들러
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { routeNumber: string } }
): Promise<NextResponse> {
  try {
    const routeNumber = params.routeNumber;

    // 버스 데이터 파일 경로
    const filePath = path.join(
      process.cwd(),
      "data",
      `wonju-bus-${routeNumber}.json`
    );

    try {
      // 파일 읽기
      const fileContents = await fs.readFile(filePath, "utf8");
      const busData: BusData = JSON.parse(fileContents);

      return NextResponse.json(busData);
    } catch (error) {
      // 파일이 없는 경우
      console.error(
        `버스 노선 ${routeNumber} 데이터를 찾을 수 없습니다.`,
        error
      );
      return NextResponse.json(
        { error: `버스 노선 ${routeNumber} 데이터를 찾을 수 없습니다.` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("버스 데이터 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
