import { ensureCalendar, holidayKnown, holidayNames } from '../../../shared/lib/calendar/calendar';
import { create } from 'zustand';
import { getCurrentDayTypes } from './dayTypeUtils';
import { DayType } from './types';

interface DayTypeState {
  currentDayTypes: DayType[];
  dayTypeText: string;
  updateDayTypes: () => void;
}

function currentState() {
  const currentDayTypes = getCurrentDayTypes();
  return { currentDayTypes, dayTypeText: !holidayKnown() ? "공휴일 정보 확인 필요" : holidayNames().join(", ") || currentDayTypes[0] };
}

// API 갱신 후 모든 화면에서 같은 한국 날짜를 사용합니다.
export const useDayTypeStore = create<DayTypeState>((set) => ({
  ...currentState(),
  updateDayTypes: async () => { await ensureCalendar(); set(currentState()); },
}));
