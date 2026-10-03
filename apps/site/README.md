# 원주버스 웹

Next.js 15 App Router, React 19, Tailwind CSS를 사용합니다. 운영 주소는 https://wonju-bus-mason.vercel.app 입니다.

## 개발

루트에서 `pnpm install --frozen-lockfile` 후 실행합니다.

```sh
pnpm dev
pnpm --filter @wonju-bus/site lint
pnpm --filter @wonju-bus/site build
pnpm start:site
```

`apps/site/.env.local`에 서버 전용 `DATABASE_URL`을 설정합니다. `.env.example`을 참고하세요. DB 장애 시 클라이언트는 `public/data/snapshot.json`으로 대체합니다. 이 파일은 `pnpm crawl`로 갱신하며 수동으로 편집하지 않습니다.

## 구조

- `src/app`: 홈, 종점/노선 목록·상세, `/api/schedules`
- `src/entities/bus`: 시간표 모델과 로더, 요일 계산
- `src/widgets`: 시간표·목록·레이아웃
- `src/shared`: 공통 UI와 Android 릴리스 메타데이터

홈의 APK 버전·용량·URL은 `src/shared/config/android-release.json`을 읽습니다. `pnpm build:apk`가 실제 빌드 결과로 생성합니다.

Vercel의 Root Directory는 `apps/site`, API 리전은 `sin1`입니다. 자세한 설정과 검증은 [운영 문서](../../docs/operations.md), 현재 제약은 [지원 범위](../../docs/status.md)를 참고하세요.
