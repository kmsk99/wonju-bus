"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { loadBusData } from "@/entities/bus/api/loadBusData";
import { BusData, DayType } from "@/entities/bus/model/types";
import { Clock } from "@/shared/ui/Clock";

export default function BusDetailPage() {
  const params = useParams<{ routeNumber: string }>();
  const routeNumber = params?.routeNumber
    ? decodeURIComponent(params.routeNumber)
    : "";

  const [busData, setBusData] = useState<BusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DayType>("평일");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [animateCards, setAnimateCards] = useState(false);

  // 1분마다 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchBusData() {
      try {
        console.log(`노선 ${routeNumber} 데이터 로딩 시작...`);
        setIsLoading(true);
        const data = await loadBusData(routeNumber);
        console.log("로드된 버스 데이터:", data);

        if (data) {
          setBusData(data);

          // 노선 데이터의 운행 정보에서 사용 가능한 첫 번째 카테고리로 탭 설정
          if (data.operationInfo && data.operationInfo.length > 0) {
            const categories = new Set(
              data.operationInfo.map((op) => op.category)
            );
            if (categories.has("평일")) {
              setActiveTab("평일");
            } else if (categories.has("토요일")) {
              setActiveTab("토요일");
            } else if (categories.has("일요일")) {
              setActiveTab("일요일");
            } else if (categories.has("공통")) {
              setActiveTab("공통");
            }
          }
        } else {
          setError(`${routeNumber}번 노선 데이터를 찾을 수 없습니다.`);
        }
      } catch (err) {
        console.error(`노선 ${routeNumber} 데이터 로딩 중 오류 발생:`, err);
        setError("버스 노선 데이터를 로드하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
        console.log(`노선 ${routeNumber} 데이터 로딩 완료`);
      }
    }

    if (routeNumber) {
      fetchBusData();
    }
  }, [routeNumber]);

  useEffect(() => {
    if (!isLoading && busData) {
      // 데이터 로딩 완료 후 카드 애니메이션 활성화
      setTimeout(() => {
        setAnimateCards(true);
      }, 100);
    }
  }, [isLoading, busData]);

  // 선택된 날짜에 맞는 운행 정보 필터링
  const filteredOperations =
    busData?.operationInfo.filter(
      (op) =>
        op.category === activeTab ||
        (activeTab === "평일" && op.category === "공통")
    ) || [];

  // 가능한 Day Type 목록 생성
  const availableTabs: DayType[] = ["평일", "토요일", "일요일", "공통"].filter(
    (tab) => {
      if (tab === "공통") return true; // 공통 탭은 항상 표시
      return busData?.operationInfo.some((op) => op.category === tab);
    }
  ) as DayType[];

  // 회차 번호를 이용하여 다음날 버스인지 확인
  const maxOpNum = Math.max(
    ...filteredOperations.map((op) => parseInt(op.operationNumber))
  );

  // 시간과 회차 번호로 다음날 버스인지 판단
  function isNextDayOperation(opNumber: string, timeStr: string): boolean {
    if (timeStr === "-") return false;

    const opNum = parseInt(opNumber);
    const [hours, minutes] = timeStr.split(":").map(Number);
    const timeInMinutes = hours * 60 + minutes;

    // 회차 번호가 낮으면서 시간이 작은 경우(오전) 다음날로 간주
    return opNum < maxOpNum / 2 && timeInMinutes < 12 * 60;
  }

  // 현재 시간 기준으로 출발 시간 분류
  function getTimeStatus(
    timeStr: string,
    opNumber: string
  ): "past" | "current" | "future" {
    if (timeStr === "-") return "future";

    const [hours, minutes] = timeStr.split(":").map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0);

    const now = currentTime; // 현재 시간 사용

    // 다음날 버스인 경우 날짜를 하루 추가
    if (isNextDayOperation(opNumber, timeStr)) {
      timeDate.setDate(timeDate.getDate() + 1);
    }

    const diffMinutes = Math.floor(
      (timeDate.getTime() - now.getTime()) / (60 * 1000)
    );

    // 30분 전후로 current 간주
    if (diffMinutes >= -30 && diffMinutes <= 30) {
      return "current";
    }

    return timeDate < now ? "past" : "future";
  }

  // 운행 회차 전체 상태 판별
  function getOperationStatus(
    departureTime: string,
    arrivalTime: string,
    operationNumber: string
  ): "current" | "past" | "future" {
    const departureStatus = getTimeStatus(departureTime, operationNumber);
    const arrivalStatus = getTimeStatus(arrivalTime, operationNumber);

    // 다음날 회차는 항상 미래로 간주
    if (isNextDayOperation(operationNumber, departureTime)) {
      return "future";
    }

    // 현재 운행 중
    if (departureStatus === "current" || arrivalStatus === "current") {
      return "current";
    }

    // 출발은 지났지만 도착은 아직
    if (departureStatus === "past" && arrivalStatus === "future") {
      return "current";
    }

    // 모두 지난 경우
    if (departureStatus === "past" && arrivalStatus === "past") {
      return "past";
    }

    // 나머지는 미래
    return "future";
  }

  // 운행 회차 정렬 함수 - 현재 시점을 기준으로 원형 순서대로 정렬
  const sortedOperations = [...filteredOperations].sort((a, b) => {
    // 각 회차의 운행 상태를 미리 계산
    const aOperationStatus = getOperationStatus(
      a.departureTime,
      a.arrivalTime,
      a.operationNumber
    );
    const bOperationStatus = getOperationStatus(
      b.departureTime,
      b.arrivalTime,
      b.operationNumber
    );

    // 먼저 operationStatus가 current인 것을 최우선으로 정렬
    if (aOperationStatus === "current" && bOperationStatus !== "current") {
      return -1;
    }
    if (aOperationStatus !== "current" && bOperationStatus === "current") {
      return 1;
    }

    // 운행 시간을 기준으로 각 버스의 상대적 순서 결정
    const [aHours, aMinutes] = a.departureTime.split(":").map(Number);
    const [bHours, bMinutes] = b.departureTime.split(":").map(Number);

    // 출발 시간을 분 단위로 변환
    const aTime = aHours * 60 + aMinutes;
    const bTime = bHours * 60 + bMinutes;

    // 현재 시간 (분 단위로 변환)
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // 회차 번호를 숫자로 변환
    const aOpNum = parseInt(a.operationNumber);
    const bOpNum = parseInt(b.operationNumber);

    // 다음날 회차 여부 확인
    const isANextDay = isNextDayOperation(a.operationNumber, a.departureTime);
    const isBNextDay = isNextDayOperation(b.operationNumber, b.departureTime);

    // 현재 시간과의 차이 계산 (양수: 미래, 음수: 과거)
    let aDiff = aTime - currentTimeInMinutes;
    let bDiff = bTime - currentTimeInMinutes;

    // 날짜 변경선을 고려
    if (isANextDay) {
      aDiff += 1440; // 다음날이면 24시간(1440분) 추가
    } else if (aDiff < -720 && !isANextDay) {
      aDiff += 1440; // 12시간 이상 전이고 다음날이 아니면 당일 나중 시간으로 간주
    }

    if (isBNextDay) {
      bDiff += 1440; // 다음날이면 24시간(1440분) 추가
    } else if (bDiff < -720 && !isBNextDay) {
      bDiff += 1440; // 12시간 이상 전이고 다음날이 아니면 당일 나중 시간으로 간주
    }

    // 다음날 회차는 항상 미래로 간주 (정렬에서 다른 회차보다 나중에)
    if (isANextDay && !isBNextDay) return 1; // a만 다음날이면 b를 앞으로
    if (!isANextDay && isBNextDay) return -1; // b만 다음날이면 a를 앞으로

    // 현재 운행중인 버스는 이미 위에서 최우선 처리되었음
    // 여기서는 둘 다 current이거나 둘 다 current가 아닌 경우만 처리

    // 둘 다 current인 경우 회차 번호순
    if (aOperationStatus === "current" && bOperationStatus === "current") {
      return aOpNum - bOpNum;
    }

    // 둘 다 current가 아닌 경우:
    if (aOperationStatus !== "current" && bOperationStatus !== "current") {
      // 둘 다 미래 운행인 경우, 시간 순서대로 (다음날은 나중에)
      if (aOperationStatus === "future" && bOperationStatus === "future") {
        // 하나만 다음날인 경우 이미 위에서 처리됨
        // 둘 다 다음날이거나 둘 다 오늘인 경우 시간순
        return aDiff - bDiff;
      }

      // 둘 다 과거 운행인 경우, 최근 것부터 (역순)
      if (aOperationStatus === "past" && bOperationStatus === "past") {
        return bDiff - aDiff;
      }

      // a는 미래, b는 과거인 경우, a를 앞으로
      if (aOperationStatus === "future" && bOperationStatus === "past") {
        return -1;
      }

      // a는 과거, b는 미래인 경우, b를 앞으로
      if (aOperationStatus === "past" && bOperationStatus === "future") {
        return 1;
      }
    }

    // 기본 정렬: 회차 번호순
    return aOpNum - bOpNum;
  });

  /**
   * 출발시간과 도착시간 사이의 소요 시간을 계산합니다.
   */
  function calculateTravelTime(
    departureTime: string,
    arrivalTime: string
  ): string {
    if (departureTime === "-" || arrivalTime === "-") return "-";

    const [depHours, depMinutes] = departureTime.split(":").map(Number);
    const [arrHours, arrMinutes] = arrivalTime.split(":").map(Number);

    let diffMinutes = arrHours * 60 + arrMinutes - (depHours * 60 + depMinutes);

    // 날짜를 넘어가는 경우 (도착시간이 출발시간보다 이른 경우)
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // 24시간(1440분) 추가
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분`;
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{routeNumber}번 버스</h1>
        <Clock />
        <div className="text-sm text-gray-500 mt-2">
          현재 시간: {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center my-4">{error}</div>
      ) : busData ? (
        <div>
          <div className="bg-white shadow-md rounded-lg p-4 mb-6">
            <h2 className="text-xl font-bold mb-3">노선 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">출발 종점</p>
                <p>{busData.routeInfo.origin}</p>
              </div>
              <div>
                <p className="font-semibold">도착 종점</p>
                <p>{busData.routeInfo.destination}</p>
              </div>
              <div>
                <p className="font-semibold">첫차</p>
                <p>{busData.routeInfo.firstBusTime}</p>
              </div>
              <div>
                <p className="font-semibold">막차</p>
                <p>{busData.routeInfo.lastBusTime}</p>
              </div>
              <div>
                <p className="font-semibold">운행 횟수</p>
                <p>{busData.routeInfo.operationCount}</p>
              </div>
              <div>
                <p className="font-semibold">배차 간격</p>
                <p>{busData.routeInfo.interval}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="flex mb-4 space-x-2 overflow-x-auto">
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === tab
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <h2 className="text-xl font-bold mb-3">
              운행 시간표 ({activeTab})
            </h2>

            {filteredOperations.length === 0 ? (
              <p className="text-center text-gray-500 my-4">
                이 날짜에는 운행 정보가 없습니다.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedOperations.map((op, index) => {
                  const departureStatus = getTimeStatus(
                    op.departureTime,
                    op.operationNumber
                  );
                  const arrivalStatus = getTimeStatus(
                    op.arrivalTime,
                    op.operationNumber
                  );
                  const operationStatus = getOperationStatus(
                    op.departureTime,
                    op.arrivalTime,
                    op.operationNumber
                  );
                  const isCurrentTimeframe = operationStatus === "current";
                  const isExpanded = expandedCard === index;

                  return (
                    <div
                      key={index}
                      className={`relative overflow-hidden rounded-lg border cursor-pointer transition-all duration-300 ${
                        operationStatus === "current"
                          ? "border-green-400 shadow-md bg-gradient-to-r from-green-50 to-blue-50"
                          : operationStatus === "past"
                          ? "border-gray-200 bg-gray-50"
                          : "border-blue-200 bg-white hover:bg-blue-50"
                      } ${
                        animateCards
                          ? `opacity-100 transform translate-y-0 ${
                              isExpanded ? "scale-100" : "hover:scale-[1.02]"
                            } hover:shadow-lg`
                          : "opacity-0 translate-y-4"
                      }`}
                      onClick={() => setExpandedCard(isExpanded ? null : index)}
                      style={{
                        transitionDelay: `${index * 50}ms`,
                      }}
                    >
                      {/* 카드 헤더 */}
                      <div
                        className={`bg-gray-100 p-3 flex justify-between items-center border-b transition-colors ${
                          isExpanded ? "bg-blue-100" : ""
                        }`}
                      >
                        <div className="font-bold flex items-center">
                          <span className="mr-1">
                            회차 {op.operationNumber}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-500 ml-1 transition-transform duration-300 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs ${
                            operationStatus === "current"
                              ? "bg-green-500 text-white animate-pulse"
                              : operationStatus === "past"
                              ? "bg-gray-400 text-white"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {operationStatus === "current"
                            ? "현재 운행 중"
                            : operationStatus === "past"
                            ? "운행 완료"
                            : "운행 예정"}
                        </div>
                      </div>

                      {/* 카드 콘텐츠 */}
                      <div className="p-4">
                        {/* 출발지 정보 */}
                        <div className="flex items-start mb-3">
                          <div
                            className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-2 transition-all duration-500 ${
                              isExpanded ? "bg-blue-200 scale-110" : ""
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 mb-1">
                              출발
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                {op.departureName !== "-" ? (
                                  <Link
                                    href={`/stops/${encodeURIComponent(
                                      op.departureName
                                    )}`}
                                    className={`font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors ${
                                      isExpanded ? "text-blue-700" : ""
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {op.departureName}
                                  </Link>
                                ) : (
                                  <span className="text-gray-400">
                                    정보 없음
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-base font-medium ${
                                  departureStatus === "current"
                                    ? "text-green-700"
                                    : departureStatus === "past"
                                    ? "text-gray-400"
                                    : "text-gray-900"
                                } ${
                                  departureStatus === "current"
                                    ? "animate-pulse"
                                    : ""
                                }`}
                              >
                                {op.departureTime !== "-"
                                  ? op.departureTime
                                  : ""}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 연결선 */}
                        <div className="flex items-center justify-center my-2">
                          <div
                            className={`border-l-2 border-dashed border-gray-300 h-6 transition-all duration-500 ${
                              isExpanded ? "h-8 border-blue-400" : ""
                            }`}
                          ></div>
                        </div>

                        {/* 도착지 정보 */}
                        <div className="flex items-start">
                          <div
                            className={`w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-2 transition-all duration-500 ${
                              isExpanded ? "bg-red-200 scale-110" : ""
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 mb-1">
                              도착
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                {op.arrivalName !== "-" ? (
                                  <Link
                                    href={`/stops/${encodeURIComponent(
                                      op.arrivalName
                                    )}`}
                                    className={`font-medium text-red-600 hover:text-red-800 hover:underline transition-colors ${
                                      isExpanded ? "text-red-700" : ""
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {op.arrivalName}
                                  </Link>
                                ) : (
                                  <span className="text-gray-400">
                                    정보 없음
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-base font-medium ${
                                  arrivalStatus === "current"
                                    ? "text-green-700"
                                    : arrivalStatus === "past"
                                    ? "text-gray-400"
                                    : "text-gray-900"
                                } ${
                                  arrivalStatus === "current"
                                    ? "animate-pulse"
                                    : ""
                                }`}
                              >
                                {op.arrivalTime !== "-" ? op.arrivalTime : ""}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 비고 - 확장 시에만 표시 또는 항상 표시 */}
                        {op.note && (isExpanded || op.note.length < 20) && (
                          <div
                            className={`mt-3 pt-3 border-t text-sm text-gray-600 transition-all duration-300 ${
                              isExpanded ? "opacity-100" : "opacity-80"
                            }`}
                          >
                            <span className="font-medium">비고:</span> {op.note}
                          </div>
                        )}

                        {/* 확장 시 추가 정보 영역 */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-sm text-gray-600 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <span className="text-xs text-gray-500">
                                  소요 시간
                                </span>
                                <div className="font-medium">
                                  {op.departureTime !== "-" &&
                                  op.arrivalTime !== "-"
                                    ? calculateTravelTime(
                                        op.departureTime,
                                        op.arrivalTime
                                      )
                                    : "-"}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">
                                  카테고리
                                </span>
                                <div className="font-medium">
                                  {op.category || "-"}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center space-x-4 mt-6 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>현재 운행 중 (±30분)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-100 mr-2"></div>
                <span>운행 예정</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-gray-400 mr-2"></div>
                <span>운행 완료</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 text-center">
        <Link href="/buses" className="text-blue-500 hover:underline mr-4">
          노선 목록으로 돌아가기
        </Link>
        <Link href="/" className="text-blue-500 hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
