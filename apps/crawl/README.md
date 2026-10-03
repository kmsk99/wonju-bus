# 원주버스 크롤러

원주시 ITS 목록(`http://its.wonju.go.kr/bus/bus04.do`)과 상세 POST(`bus04Detail.do`)를 Node.js fetch + cheerio로 수집합니다. 브라우저·Playwright 설치는 필요하지 않습니다.

## 명령

저장소 루트에서 실행합니다.

```sh
pnpm crawl                       # 전체 수집·검증 후 웹·Flutter 내장 snapshot 동기화
pnpm crawl:publish               # DATABASE_URL 필요: Neon 운영 snapshot 갱신
pnpm db:migrate                  # DATABASE_URL 필요: 초기 스키마 준비
pnpm --filter @wonju-bus/crawl build
pnpm --filter @wonju-bus/crawl test:session
pnpm --filter @wonju-bus/crawl start:route '2(평일)'
```

`start`, `start:route`, `test:basic-info`, `test:detail`, `test:multi`, `test:route`는 실제 ITS를 호출하는 진단 명령입니다. 생성되는 `apps/crawl/data/`는 Git에서 제외합니다. 정기 운영에는 검증을 거치는 `crawl:publish`를 사용합니다.

## 수집과 안전한 게시

- 목록 응답의 `JSESSIONID` 쿠키와 `CSRFToken`을 상세 POST에 전달합니다.
- 목록 연결은 최대 3회 시도합니다. 상세 요청은 기본 최대 2회, 동시 요청은 3개이며 요청 사이에 지연을 둡니다.
- 각 요청에 30초 제한을 적용합니다. HTTP 오류·빈 상세 시간표는 성공으로 처리하지 않습니다.
- 임시 디렉터리에 수집하고 전체 노선 성공 및 비어 있지 않은 시간표를 확인한 뒤 게시합니다.
- 운영 DB의 기존 노선 수보다 20% 넘게 감소하면 게시를 중단합니다.
- SHA-256이 같으면 `updated_at`을 유지하고 `checked_at`만 갱신합니다. snapshot 교체와 실행 기록은 같은 트랜잭션에서 처리합니다.
- 정상 실행 이력은 최근 60건만 보관합니다. 실패 기록은 GitHub Actions 로그에서 확인합니다.

## 파일과 데이터

`busCrawler.ts`는 원본 파싱과 파일 생성을, `syncSiteData.ts`는 전체 검증·내장 사본 동기화·DB 게시를 담당합니다. `database.ts`는 DB 스키마와 트랜잭션을 관리합니다.

snapshot은 `wonju-bus-<노선>.json`을 키로, `routeInfo`와 `operationInfo`를 값으로 갖는 객체입니다. 개별·통합 JSON 및 파일 목록은 임시 수집/진단용이며, 앱에는 snapshot만 배포합니다.

`test:session`은 네트워크를 모킹해 세션 전달, HTTP 실패, 빈 시간표, 초기 연결 재시도 및 동시 요청 제한을 검사합니다. [운영 문서](../../docs/operations.md)에서 환경변수와 장애 대응을 확인하세요.
