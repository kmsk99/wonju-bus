import { Suspense } from "react";

import { Clock } from "@/shared/ui/Clock";
import { TerminalsList } from "@/widgets/terminals/TerminalsList";

export default function Home() {
  return (
    <div className="space-y-6 pb-16">
      <section className="py-4">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">원주시 버스 종점 출발 시간</h1>
          <p className="text-sm text-gray-600">
            원주시 버스의 종점 출발 시간을 확인하고 다음 출발까지 남은 시간을 알
            수 있습니다.
          </p>
          <div className="py-2">
            <Clock />
          </div>
        </div>
      </section>

      <section className="py-2">
        <h2 className="text-xl font-semibold mb-3 flex items-center">
          <span className="w-2 h-6 bg-primary rounded mr-2"></span>
          종점 목록
        </h2>

        <Suspense
          fallback={
            <div className="p-8 text-center">종점 목록을 불러오는 중...</div>
          }
        >
          <TerminalsList />
        </Suspense>
      </section>
    </div>
  );
}
