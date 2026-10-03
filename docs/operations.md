# 운영·배포

## 환경변수

| 위치 | 이름 | 용도 |
| --- | --- | --- |
| Vercel Production / Development | `DATABASE_URL` | Vercel Marketplace Neon 서버 연결 |
| GitHub Actions secret | `DATABASE_URL` | 크롤러 게시 |
| 로컬 `apps/site/.env.local` | `DATABASE_URL` | Next.js API 개발 |
| 크롤러 프로세스 환경 | `DATABASE_URL` | `crawl:publish`, `db:migrate` |
| Flutter `--dart-define` | `BUS_DATA_URL` | 공용 API 전체 URL, 기본값은 운영 주소 |

`.env.example`에는 가짜 값만 둡니다. Next.js는 앱 디렉터리의 `.env.local`을 읽지만 크롤러는 자동으로 읽지 않습니다. 크롤러 실행 시 터미널/비밀 관리 도구에서 환경변수를 주입하세요. 키와 연결 문자열을 로그·커밋·클라이언트 번들에 넣지 않습니다.

## 웹 배포

1. `pnpm install --frozen-lockfile`과 `pnpm check` 실행
2. 변경을 커밋하고 `main`에 push
3. GitHub CI와 Vercel 배포 결과 확인
4. 운영 홈, 노선·종점 검색, `/api/schedules?meta=1` 확인

Vercel 설정: `mason-a806/wonju-bus`, Hobby, Root Directory `apps/site`, Next.js, API 리전 `sin1`. 필요할 때 루트에서 `vercel --prod`로 수동 배포할 수 있습니다. APK는 GitHub에서 내려받으며 Vercel에 바이너리를 올리지 않습니다.

## 시간표 갱신

```sh
# 오프라인 사본 갱신 (웹·Flutter)
pnpm crawl
# 운영 DB 게시 (DATABASE_URL 필요)
pnpm crawl:publish
# 최초 스키마 생성 (DATABASE_URL 필요)
pnpm db:migrate
# 운영 Actions 수동 실행
gh workflow run update-bus-data.yml --ref main
# Ubuntu/macOS의 DNS·IPv4·Node fetch 연결 비교 (DB 변경 없음)
gh workflow run check-source.yml --ref main
```

Actions는 월요일 09:00 KST에 실행되도록 예약되어 있습니다. GitHub 실행 대기 상황에 따라 시작이 늦어질 수 있습니다. 실행 시간 초과·원본 응답 오류는 실패로 표시됩니다. 같은 작업을 동시에 게시하지 않도록 concurrency 그룹을 사용합니다.

GitHub 실행 환경에서 원본 ITS의 최초 TCP 연결 시간 초과가 간헐적으로 관측됐습니다. 별도 연결 진단에서는 Ubuntu와 macOS 모두 정상 응답한 사례가 있으므로 특정 OS 문제로 단정하지 않습니다. 목록 요청 3회가 모두 실패하면 작업을 실패로 남기며, 연결 진단 후 실패한 작업을 재실행할 수 있습니다.

장애 시 Actions 로그부터 확인합니다. ITS의 HTTP 주소, 세션/CSRF, 표 구조를 점검하세요. 실패를 숨기거나 부분 데이터로 정상 snapshot을 덮어쓰지 않습니다. 노선 수 급감 차단은 실제 노선 개편 여부를 확인한 후에만 기준을 조정합니다.

웹 코드 롤백과 Neon 데이터는 별개입니다. 웹 롤백으로 DB가 돌아가지는 않습니다. 이 서비스는 과거 snapshot 전체 이력을 별도로 저장하지 않습니다. 복구가 필요하면 정상 원본을 다시 수집·검증해 게시합니다.

## Android APK 릴리스

Android 앱 ID: `com.portzone.wonjubus`. Android 7.0 이상, 통합 ARM/ARM64/x86_64 APK를 제공합니다.

1. `apps/flutter/pubspec.yaml`의 버전 이름과 빌드 번호를 올립니다.
2. `pnpm crawl`로 내장 사본을 갱신합니다.
3. `cd apps/flutter`에서 `flutter analyze`, `flutter test`를 실행합니다.
4. 서명 설정을 준비한 뒤 루트에서 `pnpm build:apk`를 실행합니다.
5. `apksigner verify --print-certs`로 APK 서명, 에뮬레이터/기기에서 설치·실행 및 이전 버전에서 업데이트를 확인합니다.
6. Flutter·도구 변경을 먼저 커밋·push하고, 그 커밋을 대상으로 GitHub Release를 생성합니다.
7. `dist/android/<버전>/wonju-bus-<버전>.apk`와 `SHA256SUMS.txt`를 업로드합니다. 태그는 `android-v<버전>`입니다.
8. 공개 링크로 파일을 내려받아 체크섬을 비교합니다.
9. 생성된 `apps/site/src/shared/config/android-release.json`과 웹 변경을 커밋·push합니다. 운영 다운로드 버튼을 확인합니다.

예시(버전은 실제 생성 파일에 맞춥니다):

```sh
gh release create android-v1.0.2 dist/android/1.0.2/wonju-bus-1.0.2.apk dist/android/1.0.2/SHA256SUMS.txt --target main --title '원주버스 Android 1.0.2' --notes-file /tmp/release-notes.md
```

### 서명 키

현재 개발 머신의 키 원본은 `~/.config/wonju-bus/android/`에 있습니다. 다른 머신에서는 비밀 관리 경로로 키를 전달하고 `apps/flutter/android/key.properties`를 준비합니다.

```properties
storeFile=/absolute/private/path/release.jks
storePassword=PRIVATE_VALUE
keyPassword=PRIVATE_VALUE
keyAlias=wonju-bus
```

키와 `key.properties`는 Git에서 제외합니다. APK 업데이트 호환성을 위해 동일한 키를 보관·백업하세요. 릴리스 키가 없으면 빌드는 실패해야 하며 디버그 키로 대신 서명하지 않습니다. CI는 분석·테스트만 수행하고 공개 APK 서명·업로드는 위 절차로 진행합니다.

## 공휴일 자료 관리

웹·앱은 `/api/holidays`에서 공개 원본의 변경을 확인합니다. 서버와 클라이언트가 각각 6시간 캐시하므로 변경 반영까지 약 12시간 걸릴 수 있습니다. API 키는 없습니다. APK 릴리스 전 `pnpm holidays:sync`로 내장 자료도 갱신하고 `pnpm test:logic`을 실행합니다. 장애·연도 범위·방학 제한은 [운행일 계약](calendar-and-service.md)을 참고하세요.
