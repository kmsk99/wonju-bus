# 원주시 버스 정보 크롤링 프로젝트

원주시 버스 정보 웹사이트(http://its.wonju.go.kr/bus/bus04.do)에서 버스 노선 및 운행 정보를 크롤링하는 프로젝트입니다.

## 개선된 기능

- 모든 원주시 버스 노선 정보 크롤링
- 특정 버스 노선만 크롤링
- 테이블에서 직접 버스 노선의 기본 정보 추출
- **동적인 출발/도착지 정보 처리** (각 노선별로 다른 출발/도착지 지원)
- 수집된 정보를 JSON 파일로 저장 (통합 및 개별 파일)
- UI 모드로 크롤링 과정 확인 가능
- 셀렉터 테스트 도구 제공

## 웹사이트 구조 및 셀렉터

원주시 버스 정보 사이트는 다음과 같은 구조로 되어 있습니다:

### 버스 노선 목록 테이블

- 셀렉터: `#content > div.sub_inner > div.para.tbl_cont > div > table`
- 각 행: `#content > div.sub_inner > div.para.tbl_cont > div > table > tbody > tr`
- 버스 노선 번호 셀: `td:first-child`
  - 예: `<td onclick="goDetail('2(평일)');">2(평일)</td>`

### 상세 정보 페이지

- URL: `http://its.wonju.go.kr/bus/bus04Detail.do`
- 테이블 구조:
  ```html
  <table class="tbl_list border">
    <caption>
      <span class="ir_text">시내버스 시간표</span>
    </caption>
    <colgroup>
      ...
    </colgroup>
    <thead>
      <tr>
        <th>운행순번</th>
        <th>출발지발</th>
        <!-- 동적 이름: 예) 중앙시장발, 관설동종점발 등 -->
        <th>도착지발</th>
        <!-- 동적 이름: 예) 용곡발, 횡성발 등 -->
        <th>구분</th>
        <th>비고</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        ...
      </tr>
    </tbody>
  </table>
  ```
- 테이블 셀렉터: `#content > div.sub_inner > div.para.tbl_cont > div > table`
- 테이블 헤더: `thead > tr > th`
- 테이블 행: `tbody > tr`

## 수집 정보

다음과 같은 정보를 수집합니다:

### 버스 노선 기본 정보

- 노선번호
- 기점
- 종점
- 첫차 시간
- 막차 시간
- 일일 운행 횟수
- 배차 간격

### 버스 운행 상세 정보

- 운행 순번
- 출발지 이름 (동적, 노선별로 다름, 예: 중앙시장, 관설동종점)
- 도착지 이름 (동적, 노선별로 다름, 예: 용곡, 횡성)
- 출발 시간
- 도착 시간
- 구분 (공통, 평일 등)
- 비고 (경유지 정보 등)

## 설치 방법

```bash
# 패키지 설치
pnpm install

# Playwright 브라우저 설치
pnpm exec playwright install chromium
```

## 사용 방법

### 모든 버스 노선 정보 크롤링

```bash
pnpm start
```

### 특정 버스 노선만 크롤링

```bash
# 예: 2번 버스 정보 크롤링
pnpm start:route 2
```

### UI 모드로 버스 노선 크롤링 테스트

브라우저 창이 열리며 크롤링 과정을 시각적으로 확인할 수 있습니다.

```bash
# 예: 2번 버스 정보를 UI 모드로 테스트
pnpm ui:route 2
```

### 셀렉터 테스트 도구 사용

대화형 콘솔에서 셀렉터를 테스트할 수 있는 도구를 제공합니다.

```bash
pnpm selector:test
```

셀렉터 테스트 도구 명령어:

- `help` : 도움말 표시
- `goto` : 지정한 URL로 이동
- `click` : 지정한 셀렉터의 요소를 클릭
- `test` : 셀렉터가 페이지에 존재하는지 테스트하고 정보 표시
- `waitfor` : 셀렉터가 페이지에 나타날 때까지 대기
- `count` : 셀렉터에 일치하는 요소 수를 세고 텍스트 표시
- `exit` : 프로그램 종료

### 버스 노선 테이블 테스트

버스 노선 목록 테이블을 테스트하고 onclick 속성을 확인합니다.

```bash
pnpm test:routes
```

### 버스 기본 정보 추출 테스트

테이블에서 직접 버스 기본 정보를 추출하는 기능을 테스트합니다.

```bash
pnpm test:basic-info
```

### Playwright Inspector 사용

Playwright Inspector를 사용하여 더 쉽게 셀렉터를 찾고 테스트할 수 있습니다.

```bash
pnpm inspector
```

> 참고: Windows 환경에서는 `SET PWDEBUG=1 && pnpm ts-node src/inspectorTest.ts` 명령으로도 실행 가능합니다.

### 버스 상세 정보 추출 테스트

버스 노선 상세 정보와 동적인 출발/도착지 처리 기능을 테스트합니다.

```bash
pnpm test:detail
```

## 결과 파일

크롤링된 정보는 `data` 디렉토리에 JSON 파일로 저장됩니다:

- 모든 노선 통합 정보: `data/wonju-bus-info.json`
- 각 노선별 개별 정보: `data/wonju-bus-[노선번호].json` (예: `data/wonju-bus-2(평일).json`)

## 기술 스택

- TypeScript
- Playwright
- Node.js
