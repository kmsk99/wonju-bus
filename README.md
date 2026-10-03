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

## 시간표 갱신

`.github/workflows/update-bus-data.yml`이 매주 월요일 09:00 KST에 실행됩니다. Actions에서 수동 실행도 가능합니다.

1. 원주시 ITS 목록 페이지의 세션 쿠키와 CSRF 토큰을 사용해 상세 시간표를 수집합니다.
2. 임시 폴더에서 전체 노선 수집과 시간표 검증을 마친 뒤 데이터 파일을 교체합니다. HTTP 오류, 빈 시간표, 일부 노선 실패 시 기존 데이터는 유지합니다.
3. 크롤러·사이트 데이터와 Flutter 내장 데이터를 함께 갱신합니다.
4. 실행별 브랜치에서 PR을 생성하고 main에 머지합니다.
5. `VERCEL_DEPLOY_HOOK` 저장소 secret으로 Vercel 운영 배포를 요청합니다. 데이터 변경이 없어도 재실행으로 배포를 복구할 수 있습니다.

GitHub 저장소의 Actions 설정에서 **Allow GitHub Actions to create and approve pull requests**가 활성화되어 있어야 합니다. Deploy Hook은 Vercel 프로젝트의 main 브랜치에 연결합니다. Hook URL은 저장소에 커밋하지 않습니다.

## 웹·Flutter 데이터

`/data/snapshot.json`은 파일명을 키로 하는 전체 시간표입니다. 개별 JSON과 같은 수집 결과에서 생성되며 공개 읽기용 CORS를 허용합니다.

Flutter는 시작 시 운영 snapshot을 가져와 검증하고 기기에 저장합니다. 네트워크 오류 또는 잘못된 응답은 마지막 정상 캐시로 대체하며, 첫 오프라인 실행은 내장 snapshot을 사용합니다. 앱 재시작 시 최신 데이터를 다시 확인합니다.

다른 데이터 서버를 사용할 경우:

```sh
flutter run --dart-define=BUS_DATA_URL=https://example.com/data
```

네트워크 수집 없이 개발할 때도 내장 JSON을 삭제하지 마세요. `pnpm crawl`이 다음 디렉터리를 함께 갱신합니다.

- `apps/crawl/data`
- `apps/site/data`
- `apps/site/public/data`
- `apps/flutter/assets/data`
