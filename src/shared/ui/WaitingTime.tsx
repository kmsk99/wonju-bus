interface WaitingTimeProps {
  minutes: number;
}

/**
 * 대기 시간을 시각적으로 표시하는 컴포넌트
 * 남은 시간에 따라 다른 색상과 텍스트 표시
 */
export function WaitingTime({ minutes }: WaitingTimeProps) {
  if (minutes === -1) {
    return <span className="text-gray-400">출발 완료</span>;
  }

  if (minutes === 0) {
    return <span className="text-red-500 font-bold">곧 출발</span>;
  }

  if (minutes < 5) {
    return <span className="text-red-500 font-bold">{minutes}분 후</span>;
  }

  if (minutes < 10) {
    return <span className="text-orange-500 font-bold">{minutes}분 후</span>;
  }

  return <span className="text-blue-500">{minutes}분 후</span>;
}
