# 원주버스

원주시 ITS의 종점·노선 시간표를 웹과 Android 앱에서 조회합니다. 표시하는 남은 시간은 시간표 기준이며 실시간 차량 위치 정보가 아닙니다.

- **웹:** https://wonju-bus-mason.vercel.app
- **Android:** 홈페이지의 앱 다운로드 버튼 또는 [GitHub Releases](https://github.com/kmsk99/wonju-bus/releases)
- **운영:** Vercel Hobby + Vercel Marketplace Neon Free, 싱가포르 리전

## 저장소 구성

| 경로 | 역할 |
| --- | --- |
| `apps/site` | Next.js 15 / React 19 / Tailwind 웹과 공용 API |
| `apps/crawl` | fetch + cheerio 기반 TypeScript 크롤러 |
| `apps/flutter` | Flutter Android 앱 및 다른 플랫폼 소스 |
| `database/schema.sql` | Neon snapshot·실행 이력 스키마 |
| `scripts` | APK 패키징 및 버전·오프라인 데이터 검증 |
| `docs` | 아키텍처, 운영·배포, 현재 지원 범위 |
| `legacy/react-native` | 이전 React Native 구현 보관. 운영·기본 빌드 대상에서 제외 |

pnpm workspace에는 사이트와 크롤러만 포함합니다. Flutter는 Flutter SDK로 관리합니다.

## 시작하기

Node.js 22 이상(`.nvmrc`), pnpm 10.24.0, Flutter 3.44.9(`.flutter-version`)를 기준으로 검증합니다.

```sh
pnpm install --frozen-lockfile
cp apps/site/.env.example apps/site/.env.local
# .env.local의 DATABASE_URL을 Vercel Marketplace Neon 연결 문자열로 설정
pnpm dev
```

DB가 없거나 연결이 실패하면 웹은 내장 시간표로 조회할 수 있습니다. `/api/schedules`는 DB 연결이 필요합니다. 실제 `.env` 및 서명 키는 커밋하지 않습니다.

```sh
pnpm check                 # lint(경고도 실패), 회귀·정합성 검사, 크롤러·웹 빌드
pnpm holidays:sync         # 공개 공휴일 자료 → 웹·Flutter 내장 달력 갱신
pnpm crawl                 # 원주시 ITS 수집 → 웹·Flutter 내장 snapshot 갱신
pnpm start:site            # 빌드한 웹 실행
cd apps/flutter
flutter pub get
flutter analyze
flutter test
flutter run               # flutter devices로 장치 ID 확인 가능
```

## 데이터 흐름

```text
원주시 ITS → GitHub Actions(월요일 09:00 KST) → 검증 → Neon
                                                       ↓
                                              /api/schedules
                                                ↙         ↘
                                              웹         Flutter
```

- 운영 수집은 `pnpm crawl:publish`로 DB만 갱신합니다. JSON 커밋이나 웹 재배포가 필요하지 않습니다.
- API CDN 캐시는 5분이며, 변경 반영까지 수 분이 걸릴 수 있습니다.
- 웹·Flutter는 공휴일 API를 공유하고 한국 시간으로 운행일과 오늘·내일 출발을 계산합니다. [공휴일 처리·비고 제한·방학 안내](docs/calendar-and-service.md)를 참고하세요.
- Flutter는 시간표 API를 조회하고, 실패하면 마지막 정상 캐시 → 내장 시간표 순서로 읽습니다. 메모리 사본은 5분 후 다시 조회합니다.
- `pnpm crawl`로 갱신하는 내장 사본은 웹의 `public/data/snapshot.json`과 Flutter의 `assets/data/snapshot.json`입니다. APK 릴리스 전에 실행합니다.

## 배포와 APK

`main`에 push하면 Vercel 프로젝트 `mason-a806/wonju-bus`가 `apps/site`를 배포합니다. CI에서는 웹·크롤러와 Flutter를 검증합니다.

```sh
pnpm build:apk
```

전용 서명 키와 `apps/flutter/android/key.properties`가 필요합니다. 결과는 `dist/android/<버전>/`에 생성되고 홈페이지 다운로드 정보도 갱신됩니다. APK를 GitHub Release에 업로드한 뒤 웹 변경을 push합니다. APK 파일과 비밀 키는 Git에 넣지 않습니다.

- [웹 개발](apps/site/README.md)
- [크롤러 사용](apps/crawl/README.md)
- [Flutter 개발](apps/flutter/README.md)
- [아키텍처·API](docs/architecture.md)
- [운영·배포·APK 릴리스](docs/operations.md)
- [지원 범위와 남은 과제](docs/status.md)

## 기여

변경에 맞는 검증을 실행하고 한국어 한 줄 커밋(`fix: 시간표 오류 처리 개선`)을 사용합니다. UI 변경은 작은 화면과 실제 동작을 확인합니다. 자세한 작업 규칙은 [AGENTS.md](AGENTS.md)에 있습니다.
