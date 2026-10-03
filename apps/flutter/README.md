# 원주버스 Flutter 앱

웹과 같은 시간표를 제공하는 Flutter 앱입니다. Android APK를 홈페이지와 GitHub Releases에서 배포합니다. iOS·데스크톱·웹 플랫폼 소스도 있지만 스토어 배포는 하지 않습니다.

## 개발

검증 SDK는 루트 `.flutter-version`의 Flutter 3.44.9입니다. Dart SDK 요구사항은 `pubspec.yaml`을 따릅니다.

```sh
cd apps/flutter
flutter pub get
flutter analyze
flutter test
flutter devices
flutter run -d <장치-ID>
flutter run -d chrome
```

## 데이터

`lib/data/schedule_source.dart`가 `/api/schedules`를 최대 8초 동안 조회하고 검증한 정상 응답을 기기에 저장합니다. 실패하면 마지막 정상 캐시, 그다음 `assets/data/snapshot.json`을 사용합니다. `bus_repository.dart`는 이를 화면용 모델로 변환합니다.

API 주소를 바꾸려면 다음처럼 전체 URL을 지정합니다. DB 연결 문자열을 앱에 넣지 않습니다.

```sh
flutter run --dart-define=BUS_DATA_URL=https://wonju-bus-mason.vercel.app/api/schedules
```

정기 시간표 변경은 앱 재설치 없이 다음 시작 시 가져옵니다. 내장 오프라인 사본은 루트의 `pnpm crawl` 실행 후 새 APK에 포함됩니다.

## 빌드와 배포

```sh
# 저장소 루트: APK 빌드 + 릴리스 파일·홈페이지 정보 생성
pnpm build:apk
# 이 디렉터리: Flutter 웹 검증용 빌드
flutter build web
```

Android 빌드는 `android/key.properties`와 전용 서명 키가 필요합니다. 앱 ID는 `com.portzone.wonjubus`이며 Android 7.0 이상을 지원합니다. 기존 설치를 업데이트하려면 같은 서명 키를 사용하고 `pubspec.yaml`의 버전 코드를 올립니다.

[APK 릴리스 절차](../../docs/operations.md#android-apk-릴리스)를 따르세요. 키·비밀번호·APK는 Git에서 제외합니다.

## 검증

테스트는 API 정상 응답·캐시·내장 데이터 대체, 잘못된 시간표 거부, 실제 내장 snapshot, 320px 화면과 200% 글자 크기를 확인합니다. 기기 설치·실행 검증은 별도로 수행합니다. 공휴일·운행일·자정·비고 제한 회귀 테스트도 실행합니다. 방학 등 현재 제약은 [지원 범위](../../docs/status.md)를 참고하세요.
