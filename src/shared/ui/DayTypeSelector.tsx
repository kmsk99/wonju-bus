import { setHolidayMode, setVacationMode } from "@/entities/bus/api/loadBusData";
import { useDayTypeStore } from "@/entities/bus/model/dayTypeState";

/**
 * 요일 타입 선택 UI 컴포넌트
 * 방학/공휴일 상태 설정 가능
 */
export function DayTypeSelector() {
  const { isVacation, isHoliday, dayTypeText, setVacation, setHoliday } =
    useDayTypeStore();

  // 요일 상태 변경 핸들러
  const handleVacationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setVacation(newValue);
    setVacationMode(newValue); // API 캐시에도 상태 전달
  };

  const handleHolidayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setHoliday(newValue);
    setHolidayMode(newValue); // API 캐시에도 상태 전달
  };

  return (
    <div className="flex flex-col items-center mt-2 mb-4">
      <div className="text-sm text-blue-600 font-semibold mb-2">
        현재: {dayTypeText}
      </div>

      <div className="flex space-x-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isVacation}
            onChange={handleVacationChange}
            className="form-checkbox h-4 w-4 text-blue-600 mr-2"
          />
          <span className="text-sm text-gray-700">방학 중</span>
        </label>

        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isHoliday}
            onChange={handleHolidayChange}
            className="form-checkbox h-4 w-4 text-blue-600 mr-2"
          />
          <span className="text-sm text-gray-700">공휴일</span>
        </label>
      </div>
    </div>
  );
}
