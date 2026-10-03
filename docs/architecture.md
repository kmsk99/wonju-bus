# 아키텍처와 데이터 계약

## 운영 구성

- 웹/API: Vercel Hobby 프로젝트 `mason-a806/wonju-bus`, GitHub `main` 연결
- DB: **Vercel Marketplace에서 제공하는 Neon Free**, `sin1`
- 수집: GitHub Actions, 매주 월요일 00:00 UTC(09:00 KST), 수동 실행 지원
- 앱: Flutter Android APK, GitHub Releases 배포

AWS Amplify 배포는 종료했습니다. 이전 개별 사이트·크롤러·Flutter 저장소는 모노레포 통합 후 삭제했습니다. React Native 구현은 `legacy/react-native`에 보관합니다.

## 수집 → 게시 → 조회

1. 원주시 ITS 목록에서 세션 쿠키, CSRF 토큰, 노선 정보를 읽습니다.
2. 상세 시간표를 제한된 동시 요청으로 수집합니다.
3. 모든 노선과 시간표를 검증합니다. 실패하면 기존 DB를 유지합니다.
4. `schedule_snapshot`의 단일 행을 트랜잭션으로 게시하고 `crawl_runs`에 기록합니다.
5. 웹·Flutter가 Vercel API를 통해 JSON을 조회합니다. DB 자격 증명은 클라이언트에 전달하지 않습니다.

`pnpm crawl`은 같은 검증 결과를 웹·Flutter 내장 snapshot으로 저장합니다. `pnpm crawl:publish`는 DB만 갱신합니다.

## API

### `GET /api/schedules`

```json
{
  "wonju-bus-10.json": {
    "routeInfo": {
      "routeNumber": "10",
      "origin": "출발 종점",
      "destination": "도착 종점",
      "firstBusTime": "06:00",
      "lastBusTime": "22:00",
      "operationCount": "예시",
      "interval": "예시"
    },
    "operationInfo": [
      {
        "operationNumber": "1",
        "departureName": "출발 종점",
        "arrivalName": "도착 종점",
        "departureTime": "06:00",
        "arrivalTime": "07:00",
        "category": "공통",
        "note": ""
      }
    ]
  }
}
```

위 값은 형식 설명용 예시입니다. 노선 이름에 운행일 구분이 포함되므로 snapshot 항목 수를 고유 버스 번호 수와 동일하게 보지 않습니다. `arrivalTime`은 원본 표의 반대편 종점 출발 시각이며, 차량의 예상 도착 시각이 아닙니다.

### `GET /api/schedules?meta=1`

`routeCount`, `updatedAt`(내용 변경), `checkedAt`(마지막 정상 수집 확인)을 반환합니다.

- 정상: HTTP 200. `ETag`, `X-Schedule-Updated-At`, `X-Schedule-Checked-At` 제공
- `If-None-Match` 일치: HTTP 304
- DB 미설정·조회 실패: HTTP 503, `Cache-Control: no-store`
- 공개 조회용 CORS `*`. CDN 캐시 300초, stale-while-revalidate 600초
- 메타데이터 ETag에는 확인 시각도 포함합니다.

## 장애 시 동작

웹은 API 실패 시 배포에 포함된 snapshot을 요청합니다. 완전한 오프라인 웹/PWA를 보장하지는 않습니다. Flutter는 앱 시작 시 API → 기기 캐시 → 내장 snapshot 순서로 읽습니다. 화면 전환에서는 5분 동안 메모리 데이터를 재사용하며 운행일은 다시 계산합니다. 동시 조회는 합칩니다.

## 저장소 경계

pnpm은 `apps/site`, `apps/crawl`만 관리합니다. Flutter 도구체인, APK 산출물(`dist/`), 이전 React Native 보관본은 독립적으로 관리합니다. runtime snapshot 2개 외의 수집 중간 JSON은 저장소에서 추적하지 않습니다.

## 공휴일 API와 운행일

`GET /api/holidays?year=<연도>`는 인증키 없는 공개 달력 JSON을 검증해 웹·Flutter에 제공합니다. DB 자격 증명이나 추가 API 키가 필요하지 않습니다. [자료 출처, 캐시와 장애 처리, 운행일 계산 계약](calendar-and-service.md)을 참고하세요.
