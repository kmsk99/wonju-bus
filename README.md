# 원주시 버스 시간표

## 개요
원주시 버스 시간표는 공식 ITS 포털에서 데이터를 수집하고, Next.js 기반 웹사이트로 종점 출발 시간을 제공하는 모노레포입니다. 크롤러가 최신 JSON 일정을 생성하며, 프런트엔드는 이를 활용해 빠르고 모바일 친화적인 화면을 제공합니다.

## 프로젝트 구조
- `apps/site` – Next.js 14 + Tailwind CSS 프런트엔드. `src/{app,entities,shared,widgets}` 구조를 따르며 `data/`의 시간표 JSON을 읽습니다.
- `apps/crawl` – TypeScript/Playwright 크롤러. http://its.wonju.go.kr 에서 전체 노선 정보를 수집해 정규화된 JSON을 `data/`에 저장합니다.
- `apps/*/data` – 크롤링 결과가 저장되는 JSON 디렉터리로, `pnpm crawl` 실행 시 두 패키지 간에 동기화됩니다.

## 필요 조건
- Node.js 18 이상 (Next.js 14 및 Playwright 요구)
- pnpm 10.5.2 (`corepack enable pnpm`으로 활성화 권장)
- Playwright용 Chromium (`pnpm exec playwright install chromium`)

## 설치 방법
```bash
pnpm install
```
워크스페이스 전체 의존성을 설치하고 두 패키지를 링크합니다.

## 사용 방법
### 사이트 개발
```bash
pnpm dev                # http://localhost:3000 에서 Next.js 개발 서버 실행
pnpm --filter @wonju-bus/site build
pnpm start:site         # 프로덕션 빌드 로컬 검증
```

### 시간표 데이터 갱신
```bash
pnpm crawl              # 크롤링 후 data/ 갱신 및 사이트 동기화
pnpm start:crawl        # 콘솔 로그를 확인하며 연속 크롤링
pnpm --filter @wonju-bus/crawl selector:test   # 셀렉터 검증 대화형 도구
```
크롤링으로 생성된 JSON은 코드 변경과 함께 커밋해 배포본과 데이터가 일치하도록 유지합니다.

## 테스트와 품질 점검
Playwright 스크립트는 `apps/crawl/src`에 위치합니다.
- `pnpm --filter @wonju-bus/crawl test:routes` – 노선 목록 테이블 검증
- `pnpm --filter @wonju-bus/crawl test:basic-info` – 기본 정보 추출 확인
- `pnpm --filter @wonju-bus/crawl test:detail` – 노선별 상세 시간표 파싱 점검
프런트엔드 자동화 테스트는 아직 없으므로 UI 기능 추가 시 수동 확인 절차를 PR 본문에 기록하거나 테스트 디렉터리에 케이스를 추가하세요.

## 기여 안내
자세한 공헌 지침은 `AGENTS.md`를 참조하세요. 커밋은 한국어 현재형으로 간결하게 작성하고, 데이터 재생성 여부를 명시하며, UI 변경 시 스크린샷 또는 재현 방법을 첨부하면 리뷰가 수월해집니다.
