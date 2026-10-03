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
  return { currentDayTypes, dayTypeText: currentDayTypes[0] };
}

// 공휴일·방학 자동 판별은 아직 제공하지 않습니다.
export const useDayTypeStore = create<DayTypeState>((set) => ({
  ...currentState(),
  updateDayTypes: () => set(currentState()),
}));
