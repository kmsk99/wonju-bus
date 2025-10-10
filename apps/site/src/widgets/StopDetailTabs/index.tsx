interface StopDetailTabsProps {
  activeTab: "all" | "from" | "to";
  departureRoutesCount: number;
  arrivalRoutesCount: number;
  onTabChange: (tab: "all" | "from" | "to") => void;
}

/**
 * 정류장 상세 페이지 탭 컴포넌트
 */
export function StopDetailTabs({
  activeTab,
  departureRoutesCount,
  arrivalRoutesCount,
  onTabChange,
}: StopDetailTabsProps) {
  return (
    <div className="flex mb-4 space-x-2 overflow-x-auto">
      <button
        className={`px-4 py-2 rounded-md ${
          activeTab === "all"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={() => onTabChange("all")}
      >
        전체 시간표
      </button>
      <button
        className={`px-4 py-2 rounded-md ${
          activeTab === "from"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={() => onTabChange("from")}
      >
        출발 노선 ({departureRoutesCount}개)
      </button>
      <button
        className={`px-4 py-2 rounded-md ${
          activeTab === "to"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={() => onTabChange("to")}
      >
        도착 노선 ({arrivalRoutesCount}개)
      </button>
    </div>
  );
}
