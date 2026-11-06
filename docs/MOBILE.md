# 4단계: 모바일 앱 구조와 빌드

새 프레임워크를 도입하지 않고, 이미 쓰던 Capacitor 7 구조를 유지했습니다.

## 현재 구조

| 항목 | 내용 |
|---|---|
| 게임 원본 | `www/index.html` 한 파일 (HTML, CSS, JS 포함) |
| 루트 `index.html` | 저장소에 없음. `tools/make_code_page.py`가 복사 페이지 안에서 만드는 한 파일 실행본일 뿐, 앱 빌드에 쓰이지 않음 |
| 웹앱(PWA) | `www`를 GitHub Pages로 배포 (`.github/workflows/pages.yml`) |
| Android | `.github/workflows/android.yml`이 `www`로 프로젝트를 만들어 APK 빌드. 서명키가 있으면 AAB도 빌드 |
| iOS | `.github/workflows/ios.yml`이 시뮬레이터용으로 컴파일 확인 (서명 없음) |
| 서비스 워커 | `www/sw.js`. 게임 화면은 네트워크 우선(오프라인이면 저장본), 나머지는 캐시 우선. 버전이 바뀌면 열린 화면을 한 번 다시 연다. `window.Capacitor`가 있으면 등록하지 않음 |
| 외부 CDN | 앱·PWA에는 없음. 복사 페이지의 한 파일 실행본만 three.js와 Google Fonts를 CDN에서 받음 |
| Three.js | `www/vendor/three.min.js` r128 |
| PeerJS | 삭제됨 |
| 저장 | WebView의 `localStorage`. 앱 삭제나 OS의 저장 공간 정리로 지워질 수 있어 백업 코드를 제공 |

## 명령

```bash
npm install
npm test
npx cap add android
npx cap sync android
```

## 이번에 고친 것

- **영어 음성:** 안드로이드 WebView에서는 `speechSynthesis`가 없을 수 있어, 앱에서는 `@capacitor-community/text-to-speech`로 기기 음성을 사용. 웹은 기존 방식 유지.
- **TTS 엔진 찾기:** Android 11 이상을 위해 빌드 때 매니페스트에 `TTS_SERVICE` 쿼리를 추가.
- **백그라운드 전환:** 화면을 벗어나면 음성을 멈추고 오디오를 일시 중지, 돌아오면 오디오를 재개. 저장은 기존처럼 `visibilitychange`와 `pagehide`에서 수행.
- **iOS 빌드 확인:** 클라우드 맥에서 컴파일을 확인하는 워크플로 추가.

## 이미 있던 것 (이번에 바꾸지 않음)

앱 아이콘·스플래시(`assets/`, `@capacitor/assets`), 노치 대응(`viewport-fit=cover`, safe-area), 터치 조작, 오프라인(글꼴·3D 라이브러리 포함), 저사양 대응(FPS가 낮으면 렌더링 해상도를 낮춤).

## 빌드와 기기 검증 상태

빌드 결과는 최신 보고를 따릅니다. **실제 Android·iOS 기기 시험은 아직 하지 않았습니다.** 기기에서 확인할 항목:

- [ ] 영어 음성이 나오는지, 한국어 안내 음성이 나오는지
- [ ] 다른 앱을 다녀와도 음악과 게임이 정상인지, 저장이 유지되는지
- [ ] 비행기 모드에서 실행되는지
- [ ] 노치와 홈 표시줄에 버튼이 가리지 않는지
- [ ] 저사양 기기에서 3D 화면의 속도와 발열
- [ ] 뒤로 가기 버튼 동작(Android)
- [ ] 앱 업데이트 후 저장 유지
