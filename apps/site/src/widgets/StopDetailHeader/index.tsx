import { Clock } from "@/shared/ui/Clock";

interface StopDetailHeaderProps {
  stopName: string;
}

/**
 * 정류장 상세 페이지 헤더 컴포넌트
 */
export function StopDetailHeader({ stopName }: StopDetailHeaderProps) {
  return (
    <div className="flex flex-col items-center mb-6">
      <h1 className="text-2xl font-bold mb-2">{stopName}</h1>
      <p className="text-gray-600">버스 시간표</p>
      <Clock />
    </div>
  );
}
