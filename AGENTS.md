# Repository Guidelines

## 범위와 구조

운영 앱은 `apps/site`(Next.js 15), `apps/crawl`(TypeScript), `apps/flutter`(Flutter)입니다. pnpm workspace는 사이트와 크롤러만 포함합니다. `legacy/react-native`는 이전 구현 보관본이며 기본 설치·검증·배포에서 제외합니다.

웹은 Vercel Hobby, DB는 **Vercel Marketplace Neon Free**를 사용합니다. AWS Amplify 설정을 되살리지 않습니다. 운영 흐름과 현재 제약은 `docs/architecture.md`, `docs/operations.md`, `docs/status.md`를 읽고 실제 코드·배포 상태와 대조합니다.

## 개발·검증

- Node.js 22 이상, pnpm 10.24.0, Flutter 버전은 `.flutter-version` 참고
- `pnpm install --frozen-lockfile`
- `pnpm dev`: 사이트 개발
- `pnpm check`: 웹 lint(경고 허용 안 함), 크롤러 회귀·데이터 정합성 검사, 크롤러·웹 빌드
- Flutter 변경: `cd apps/flutter && flutter analyze && flutter test`
- UI 변경: 320px 모바일 화면과 실제 검색·상세 이동 확인
- APK 배포: `pnpm build:apk`, 서명 검사, 기기 설치/업데이트 확인, GitHub Release 업로드, 운영 다운로드 확인

크롤러의 `test:session`은 외부 통신 없는 회귀 테스트입니다. `test:basic-info`, `test:detail`, `test:multi`, `test:route`는 원본 ITS를 호출하는 진단 명령입니다. 필요하지 않은 실제 크롤링은 반복하지 않습니다.

## 데이터·비밀 정보

- `pnpm crawl`: 검증 후 웹·Flutter 내장 snapshot 2개 갱신
- `pnpm crawl:publish`: GitHub Actions에서 Neon만 갱신, 커밋·PR·재배포 없음
- 수집 중간 JSON과 APK는 생성물이며 Git에서 제외
- `DATABASE_URL`은 서버/Actions에만 저장하고 Flutter에는 공용 API URL만 제공
- `.env.local`, `key.properties`, keystore를 커밋하거나 로그에 출력하지 않음
- APK 버전은 `pubspec.yaml`에서 관리하며 웹 메타데이터는 패키징 스크립트로 생성
- 같은 앱의 업데이트는 기존 서명 키를 유지하고 versionCode를 증가시킴

## 스타일·변경 관리

TypeScript strict, 2칸 들여쓰기, React 컴포넌트 PascalCase, 훅 use 접두어를 사용합니다. `@/shared/...` 별칭을 우선 사용하고 Dart는 `dart format`을 적용합니다. 사용하지 않는 코드·오래된 문서는 남겨 두지 않되 보관본을 운영 코드로 혼동하지 않습니다.

커밋은 논리 단위별 한국어 한 줄(`<prefix>: <한국어 설명>`)로 작성합니다. PR에는 영향 범위, 실행한 검증, UI 스크린샷, 데이터 재생성 여부를 기록합니다. 배포 요청 시 push만으로 완료했다고 하지 말고 CI와 Vercel 운영 상태·API·APK 링크를 확인합니다.

## 공휴일·운행일 변경

운행일은 한국 시간 기준이며 웹과 Flutter의 규칙을 함께 수정합니다. `pnpm test:logic`과 `flutter test`를 실행합니다. 내장 달력은 `pnpm holidays:sync`로 두 앱에 동기화하고 공개 자료의 MIT 고지를 유지합니다. 자세한 계약은 `docs/calendar-and-service.md`에 있습니다.
