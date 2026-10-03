# 원주시 버스 시간표

원주시 ITS 시간표를 수집해 웹과 Flutter 앱에 제공하는 모노레포입니다.

## 구성

- `apps/site`: Next.js 15 웹. Vercel의 Mason Hobby 팀에서 배포합니다.
- `apps/crawl`: TypeScript + cheerio 크롤러.
- `apps/flutter`: Flutter 앱. 이전 `wonju_bus_flutter`의 전체 Git 이력을 통합했습니다.
- `apps/mobile`: 기존 React Native 앱을 보존한 디렉터리입니다. 이번 웹·Flutter 데이터 통합 대상에는 포함하지 않습니다.

Node.js 22 이상, pnpm 10.24.0을 사용합니다. Flutter는 별도 SDK로 관리합니다.

## 개발과 검증

```sh
pnpm install
pnpm dev
pnpm --filter @wonju-bus/site build
pnpm --filter @wonju-bus/crawl build
pnpm crawl
cd apps/flutter
flutter pub get
flutter test
flutter run
```

## 배포

- 운영 주소: https://wonju-bus-mason.vercel.app
- Vercel 프로젝트: `mason-a806/wonju-bus`, Hobby 플랜
- Git 저장소: `kmsk99/wonju-bus`, 운영 브랜치 `main`
- Root Directory: `apps/site`, 프레임워크 Next.js
- 수동 배포: 저장소 루트에서 `vercel --prod`

## 시간표 갱신과 Neon

Vercel Marketplace에서 만든 Neon `wonju-bus` **Free** 플랜을 사용합니다. DB와 API는 싱가포르 리전입니다. 유료 자동 업그레이드는 구성하지 않습니다.

```text
원주시 ITS → GitHub Actions → 검증된 snapshot → Neon Postgres
                                            ↓
                             Vercel /api/schedules
                                  ↙              ↘
                                웹              Flutter
```

- 매주 월요일 09:00 KST에 Actions가 `pnpm crawl:publish`를 실행합니다. 수동 실행도 가능합니다.
- 세션 쿠키와 CSRF 토큰을 유지하며 최대 3개 요청을 동시에 처리합니다. 30초 제한과 지수형 재시도를 적용합니다.
- 모든 노선이 수집되고 비어 있지 않은 경우에만 게시합니다. 노선 수가 이전보다 20% 이상 감소하면 원본 확인을 위해 게시를 중단합니다.
- 트랜잭션으로 완성된 snapshot을 교체합니다. SHA-256이 같으면 데이터 변경 시각을 유지하고 확인 시각만 갱신합니다.
- 현재 snapshot 하나와 최근 실행 60건을 보관합니다. API는 CDN에서 5분 캐시하므로 시간표 갱신에 커밋·PR·사이트 재배포가 필요하지 않습니다.
- DB 연결은 Vercel 서버와 Actions의 `DATABASE_URL` secret에만 둡니다. 웹·앱에는 연결 문자열을 전달하지 않습니다.

스키마는 `database/schema.sql`이며 처음 준비할 때 `DATABASE_URL`을 설정하고 `pnpm db:migrate`를 실행합니다. Vercel 환경변수는 `vercel env pull`로 받을 수 있습니다. `.env.local`은 커밋하지 않습니다.

```sh
# 로컬 검증 및 내장 오프라인 데이터 동기화
pnpm crawl
# Neon 운영 데이터 갱신 (DATABASE_URL 필요)
pnpm crawl:publish
# 세션·오류·동시 요청 제한·재시도 회귀 테스트
pnpm --filter @wonju-bus/crawl test:session
```

## 공용 API와 오프라인 데이터

`GET /api/schedules`는 파일명을 키로 하는 전체 시간표를 반환합니다. `?meta=1`은 시간표 수·변경 시각·확인 시각을 반환합니다. ETag/304 및 공개 읽기용 CORS를 지원합니다. 캐시 때문에 변경 반영까지 수 분 걸릴 수 있습니다.

웹은 공용 API를 우선 사용하고 실패하면 배포에 포함된 JSON을 읽습니다. Flutter는 API 응답을 검증한 뒤 기기에 저장하며, 실패하면 마지막 정상 캐시, 그다음 내장 snapshot을 사용합니다. 앱 시작 시 다시 확인합니다.

```sh
cd apps/flutter
flutter run --dart-define=BUS_DATA_URL=https://wonju-bus-mason.vercel.app/api/schedules
```

`pnpm crawl`은 `apps/crawl/data`, `apps/site/data`, `apps/site/public/data`, `apps/flutter/assets/data`의 오프라인 사본을 동기화합니다. 정기 운영 갱신은 Neon만 변경하므로 이 사본은 다음 앱 릴리스 전에 갱신하세요.
