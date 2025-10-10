# Repository Guidelines

## 프로젝트 구조 및 모듈 구성
이 저장소는 pnpm 기반 모노레포로 `apps/` 하위에 두 개의 앱이 있습니다. `apps/site`는 Next.js 14 기반 프런트엔드로 `src/{app,entities,shared,widgets}` 구조를 따르며 Tailwind UI와 JSON 시간표(`data/`)를 사용합니다. 정적 자산은 `public/`에 둡니다. `apps/crawl`은 Playwright와 TypeScript로 작성된 크롤러이며 주요 로직은 `src/`에, 크롤링 결과는 `data/`에 저장됩니다. `pnpm crawl`을 실행하면 최신 JSON을 생성하여 사이트 패키지의 `data/`까지 동기화합니다.

## 빌드·테스트·개발 명령어
- `pnpm install` — 워크스페이스 전역 의존성을 설치하고 패키지를 링크합니다.
- `pnpm dev` — 사이트 패키지의 Next.js 개발 서버를 가동합니다.
- `pnpm --filter @wonju-bus/site build` — Next.js 프로덕션 빌드를 생성합니다.
- `pnpm start:site` — 빌드된 사이트를 로컬에서 확인합니다.
- `pnpm crawl` — 크롤러를 실행하고 결과 JSON을 사이트로 복사합니다.
- `pnpm --filter @wonju-bus/crawl selector:test` — 셀렉터 검증용 대화형 도구를 실행합니다. 최초 한 번은 `pnpm exec playwright install chromium`으로 브라우저를 설치해야 합니다.

## 코드 스타일 및 네이밍 규칙
TypeScript는 `strict` 모드가 활성화되어 있으므로 명시적 타입을 유지하고 2칸 들여쓰기를 지킵니다. `pnpm --filter @wonju-bus/site lint`로 Next.js ESLint 규칙을 준수하며 import와 JSX 속성에는 가능한 한 단일 따옴표를 사용합니다. React 컴포넌트·훅은 PascalCase/`use*` 패턴을, 유틸 함수는 camelCase를 사용합니다. 크롤러가 생성하는 JSON 파일은 `wonju-bus-<노선>.json` 형식을 따라야 사이트 로더가 인식합니다. 경로 참조 시에는 `@/shared/ui/Clock`처럼 설정된 alias를 선호합니다.

## 테스트 가이드라인
크롤러 검증은 `apps/crawl/src`에 위치한 Playwright 스크립트로 진행합니다. `pnpm --filter @wonju-bus/crawl test:routes`로 노선 목록 파싱을, `test:basic-info`로 기본 정보 추출을, `test:detail`로 상세 시간표 파싱을 확인합니다. 새로운 셀렉터는 `selector:test`에서 미리 검증하고 필요한 보조 스크립트는 다른 `test*.ts` 파일과 같은 디렉터리에 둡니다. 현재 사이트 앱에는 자동화 테스트가 없으므로 UI 변경 시 `src/widgets/<기능>/__tests__/`와 같은 경로에 테스트를 추가하거나 PR에 수동 검증 절차를 명시합니다.

## 커밋 및 PR 가이드라인
기존 Git 히스토리는 영어 명령형이지만, 앞으로는 한국어 현재형으로 간결하게 작성합니다(예: `버스 데이터 갱신`, `크롤러 오류 처리 개선`). 관련 이슈나 참고 티켓이 있다면 본문에 링크합니다. Pull Request에는 변경 요약, 크롤러·사이트 영향, UI 변경 시 스크린샷 또는 GIF, 재현 방법(`pnpm crawl`, `pnpm dev` 등)을 포함합니다. 시간표 JSON을 재생성했다면 명확히 언급해 리뷰어가 동일한 환경을 갖출 수 있도록 안내합니다.
