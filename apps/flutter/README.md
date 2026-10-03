# 원주 버스 종점 정보 Flutter 앱

Flutter 기반으로 구현한 **원주시 버스 종점/노선 시간표** 애플리케이션입니다. 기존 React(Next.js) 웹 프로젝트(`apps/site`)의 UI/UX와 데이터 구조를 Flutter로 이식했으며, 모바일과 웹 양쪽에서 자연스럽게 동작하도록 구성했습니다.

---

## 주요 기능
- 홈 화면: 실시간 시계, 종점/노선 조회로 이동하는 진입 카드, 데이터 최신화 정보.
- 종점 목록: 검색/필터와 함께 종점별 연결 노선 수 표시.
- 종점 상세: 출발/도착/전체 탭, 다음 출발 정보, 대기 시간 뱃지, 노선 요약.
- 노선 목록: 노선 번호 검색과 카드형 UI.
- 노선 상세: 요일/카테고리별 운행 시간표, 현재 운행 회차 강조, 회차 상세 정보.
- 데이터 로더: `assets/data`에 포함된 JSON을 메모리에 캐시하고, 요일/방학/공휴일 로직을 적용하여 현재 운행 정보를 계산.

---

## 프로젝트 구조
```
assets/data/      └─ 원주 버스 시간표 JSON (웹 프로젝트 동일 데이터)
lib/
 ├─ app.dart      └─ MaterialApp, 테마, 라우팅 정의
 ├─ app_routes.dart
 ├─ data/         └─ BusRepository (데이터 로딩/캐시/집계)
 ├─ features/     ├─ home/ ... 등 화면 구성
 ├─ models/       └─ BusData/Operation 모델
 ├─ utils/        └─ 요일 판별 등 유틸리티
 └─ widgets/      └─ 재사용 UI (시계, 뱃지, 카드 등)
pubspec.yaml       └─ Flutter 설정 및 assets 등록
```

---

## 개발 환경 준비
1. Flutter SDK 설치 (3.9.x 이상 권장)  
   - [공식 설치 가이드](https://docs.flutter.dev/get-started/install)
2. 저장소 클론 후 프로젝트 루트(`wonju_bus_flutter`)로 이동.
3. 의존성 설치:
   ```bash
   flutter pub get
   ```

> **Tip**: Flutter 3.13 이상에서 웹 호환성 및 Material 3 지원이 가장 안정적입니다.

---

## 실행 방법

### 1. 모바일 (Android / iOS)
```bash
# 안드로이드
flutter run -d android

# iOS 시뮬레이터
flutter run -d ios
```

### 2. 웹 (Chrome 등)
```bash
flutter run -d chrome
```

> 웹 개발 시 `flutter run -d chrome --web-renderer canvaskit` 옵션을 주면 렌더링 품질이 좋아집니다.

---

## 패키징 / 배포 빌드

### Android APK
```bash
flutter build apk --release
```

### iOS (Archive)
```bash
flutter build ipa --release
```

### Web 정적 빌드
```bash
flutter build web --release
```
빌드 결과는 `build/web` 디렉터리에 생성되며, 정적 호스팅(예: Firebase Hosting, Vercel, Nginx)에 바로 배포할 수 있습니다.

---

## 데이터 & 캐싱 메커니즘
- `assets/data/`의 JSON 파일을 `rootBundle`을 통해 로드합니다.
- `assets/data/bus-files.json`을 우선 참조하며, 누락 시 `AssetManifest.json`을 스캔해 모든 `wonju-bus-*.json` 파일을 자동 감지합니다.
- 로딩한 데이터는 `BusRepository` 단일 인스턴스에서 캐시하여 화면 전환 간 재사용합니다.
- 요일/공휴일/방학 계산 로직은 React 프로젝트와 동일한 규칙을 적용했습니다.

---

## 자주 묻는 질문

### Q1. 데이터 파일을 바꾸면 앱을 다시 빌드해야 하나요?
네. `assets/data`에 있는 JSON은 빌드 시점에 포함됩니다. 데이터가 변경되면 `flutter pub get` 후 다시 빌드/실행해야 합니다.

### Q2. `flutter run` 중 자산 로딩 오류가 발생합니다.
- `flutter clean && flutter pub get`으로 캐시를 초기화한 뒤 다시 실행해 주세요.
- Chrome 개발 서버를 종료 후 재시작(Hot Restart)하지 않으면 백엔드 데이터 변경이 반영되지 않을 수 있습니다.

---

## 기여 & 라이선스
내부 프로젝트용으로 작성되었으며, 필요 시 회사 규정에 맞춰 활용/배포하세요. Pull Request나 개선 제안은 환영합니다.  
문의: 프로젝트 관리자 (예: @kmsk99)
