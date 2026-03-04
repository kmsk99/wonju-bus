import {create} from 'zustand';
import {getCurrentDayTypes} from './dayTypeUtils';
import {DayType} from './types';

interface DayTypeState {
  currentDayTypes: DayType[];
  isVacation: boolean;
  isHoliday: boolean;
  dayTypeText: string;
  setVacation: (isVacation: boolean) => void;
  setHoliday: (isHoliday: boolean) => void;
  updateDayTypes: () => void;
}

function generateDayTypeText(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();

  if (dayOfWeek === 0) {
    return '일요일';
  }
  if (dayOfWeek === 6) {
    return '토요일';
  }
  return '평일';
}

export const useDayTypeStore = create<DayTypeState>(set => ({
  currentDayTypes: getCurrentDayTypes(false, false),
  isVacation: false,
  isHoliday: false,
  dayTypeText: generateDayTypeText(),

  setVacation: () =>
    set(state => ({
      ...state,
      isVacation: false,
      currentDayTypes: getCurrentDayTypes(false, false),
      dayTypeText: generateDayTypeText(),
    })),

  setHoliday: () =>
    set(state => ({
      ...state,
      isHoliday: false,
      currentDayTypes: getCurrentDayTypes(false, false),
      dayTypeText: generateDayTypeText(),
    })),

  updateDayTypes: () =>
    set(state => ({
      ...state,
      currentDayTypes: getCurrentDayTypes(false, false),
      dayTypeText: generateDayTypeText(),
    })),
}));
