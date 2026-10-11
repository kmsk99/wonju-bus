# 원주버스

원주시 버스의 종점·노선 시간표를 웹과 Android 앱에서 검색합니다. 오늘·내일의 출발 시각과 남은 시간을 확인할 수 있습니다.

[웹에서 사용하기](https://wonju-bus-mason.vercel.app) · [Android APK](https://github.com/kmsk99/wonju-bus/releases) · [지원 범위](docs/status.md)

**시간표 기반 서비스입니다. 실시간 차량 위치나 도착 예측은 제공하지 않습니다.**

## 주요 기능

- 종점·노선 검색과 운행일에 맞는 출발 시각 조회
- 웹·Flutter가 같은 API와 공휴일 기준을 사용하는 시간표 처리
- 수집 데이터를 검증한 뒤 게시하고, 수집 실패 시 기존 시간표 유지
- Flutter에서 통신 실패 시 마지막 정상 캐시 또는 내장 시간표 사용

## 구성

```text
원주시 ITS → TypeScript 크롤러 → Neon → Next.js API → 웹 / Flutter
```

| 경로 | 역할 |
| --- | --- |
| `apps/site` | Next.js 웹과 공용 API |
| `apps/crawl` | 시간표 수집·검증·게시 |
| `apps/flutter` | Flutter 앱 — Android APK 배포 |
| `database` | snapshot·수집 이력 스키마 |

웹은 Vercel, DB는 Vercel Marketplace Neon을 사용합니다. GitHub Actions가 매주 시간표를 수집합니다. 이전 React Native 구현은 `legacy/react-native`에 보관되어 있습니다.

## 로컬 실행

Node.js 22 이상, pnpm 10.24.0을 사용합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

DB 없이도 웹의 내장 시간표를 조회할 수 있습니다. API를 실행하려면 `apps/site/.env.example`을 `.env.local`로 복사하고 `DATABASE_URL`을 설정하세요.

```sh
pnpm check  # 웹·크롤러 lint, 회귀·정합성 검사, 빌드
```

Flutter 실행 방법과 SDK 버전은 [앱 README](apps/flutter/README.md)와 `.flutter-version`을 참고하세요. Android는 APK 직접 설치 방식이며 iOS·Play Store에는 배포하지 않았습니다.

## 개발 문서

[웹](apps/site/README.md) · [크롤러](apps/crawl/README.md) · [아키텍처·API](docs/architecture.md) · [운영·APK 릴리스](docs/operations.md) · [공휴일·운행일](docs/calendar-and-service.md) · [기여 규칙](AGENTS.md)
