import { create } from "zustand";

import { getCurrentDayTypes } from "./dayTypeUtils";
import { DayType } from "./types";

interface DayTypeState {
  // 상태
  currentDayTypes: DayType[];
  isVacation: boolean;
  isHoliday: boolean;
  dayTypeText: string;

  // 액션 - 기능은 유지하지만 실제로는 사용되지 않음
  setVacation: (isVacation: boolean) => void;
  setHoliday: (isHoliday: boolean) => void;
  updateDayTypes: () => void;
}

/**
 * 현재 요일 타입 상태를 관리하는 스토어
 * 방학/공휴일 기능 제거로 항상 기본값(false)만 사용
 */
export const useDayTypeStore = create<DayTypeState>((set) => ({
  currentDayTypes: getCurrentDayTypes(false, false),
  isVacation: false,
  isHoliday: false,
  dayTypeText: generateDayTypeText(false, false),

  // 기능은 유지하지만 실제로는 사용되지 않음
  setVacation: (isVacation: boolean) =>
    set((state: DayTypeState) => {
      const currentDayTypes = getCurrentDayTypes(false, false);
      return {
        ...state,
        isVacation: false,
        currentDayTypes,
        dayTypeText: generateDayTypeText(false, false),
      };
    }),

  setHoliday: (isHoliday: boolean) =>
    set((state: DayTypeState) => {
      const currentDayTypes = getCurrentDayTypes(false, false);
      return {
        ...state,
        isHoliday: false,
        currentDayTypes,
        dayTypeText: generateDayTypeText(false, false),
      };
    }),

  updateDayTypes: () =>
    set((state: DayTypeState) => {
      const currentDayTypes = getCurrentDayTypes(false, false);
      return {
        ...state,
        currentDayTypes,
        dayTypeText: generateDayTypeText(false, false),
      };
    }),
}));

/**
 * 현재 요일 타입을 텍스트로 표시
 * 방학/공휴일 상태는 항상 false로 설정되어 표시되지 않음
 */
function generateDayTypeText(isVacation: boolean, isHoliday: boolean): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: 일요일, 1-5: 평일, 6: 토요일

  let dayText = "";

  if (dayOfWeek === 0) {
    dayText = "일요일";
  } else if (dayOfWeek === 6) {
    dayText = "토요일";
  } else {
    dayText = "평일";
  }

  return dayText;
}
