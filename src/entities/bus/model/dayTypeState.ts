import { create } from "zustand";

import { getCurrentDayTypes } from "./dayTypeUtils";
import { DayType } from "./types";

interface DayTypeState {
  // 상태
  currentDayTypes: DayType[];
  isVacation: boolean;
  isHoliday: boolean;
  dayTypeText: string;

  // 액션
  setVacation: (isVacation: boolean) => void;
  setHoliday: (isHoliday: boolean) => void;
  updateDayTypes: () => void;
}

/**
 * 현재 요일 타입 상태를 관리하는 스토어
 */
export const useDayTypeStore = create<DayTypeState>((set) => ({
  currentDayTypes: getCurrentDayTypes(false, false),
  isVacation: false,
  isHoliday: false,
  dayTypeText: generateDayTypeText(false, false),

  setVacation: (isVacation: boolean) =>
    set((state: DayTypeState) => {
      const currentDayTypes = getCurrentDayTypes(isVacation, state.isHoliday);
      return {
        ...state,
        isVacation,
        currentDayTypes,
        dayTypeText: generateDayTypeText(isVacation, state.isHoliday),
      };
    }),

  setHoliday: (isHoliday: boolean) =>
    set((state: DayTypeState) => {
      const currentDayTypes = getCurrentDayTypes(state.isVacation, isHoliday);
      return {
        ...state,
        isHoliday,
        currentDayTypes,
        dayTypeText: generateDayTypeText(state.isVacation, isHoliday),
      };
    }),

  updateDayTypes: () =>
    set((state: DayTypeState) => {
      const currentDayTypes = getCurrentDayTypes(
        state.isVacation,
        state.isHoliday
      );
      return {
        ...state,
        currentDayTypes,
        dayTypeText: generateDayTypeText(state.isVacation, state.isHoliday),
      };
    }),
}));

/**
 * 현재 요일 타입을 텍스트로 표시
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

  if (isVacation && isHoliday) {
    return `${dayText} (방학, 공휴일)`;
  } else if (isVacation) {
    return `${dayText} (방학)`;
  } else if (isHoliday) {
    return `${dayText} (공휴일)`;
  }

  return dayText;
}
