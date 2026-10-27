# 말랑 펫하우스 — 앱 설치·출시 안내

초등학생용 펫 키우기 게임입니다. 같은 게임 파일(`www/`) 하나로 세 가지 형태를 만듭니다.

| 형태 | 설치 방법 | 비용 | 필요한 것 |
|---|---|---|---|
| **PWA(웹앱)** | 폰 브라우저에서 "앱 설치 / 홈 화면에 추가" | 무료 | https 주소 (GitHub Pages 무료) |
| **안드로이드 앱** | 구글 플레이 또는 APK 파일 | 개발자 등록 25달러 1회 | GitHub Actions (PC에 설치할 것 없음) |
| **아이폰 앱** | 애플 앱스토어 | 연 99달러 | Mac + Xcode (또는 클라우드 Mac) |

---

## 폴더 구성

```
malang_pet_house/
├─ www/                      ← 게임 본체 (이 폴더만 있으면 어디서든 실행)
│  ├─ index.html             게임 전체 코드
│  ├─ manifest.webmanifest   앱 이름·아이콘·전체화면 설정
│  ├─ sw.js                  오프라인 캐시 (인터넷 없이 실행)
│  ├─ privacy.html           개인정보처리방침 (스토어 등록 필수)
│  ├─ fonts/                 Jua·고운돋움 (OFL 무료 라이선스, 자주 쓰는 한글 2,350자)
│  └─ icons/                 앱 아이콘 (192·512·1024, 안드로이드 적응형 포함)
├─ assets/                   네이티브 앱 아이콘·스플래시 원본 (Capacitor가 읽음)
├─ capacitor.config.json     네이티브 앱 설정 (앱 ID, 이름)
├─ package.json              Capacitor 패키지 목록
├─ .github/workflows/
│  ├─ pages.yml              www → GitHub Pages 자동 배포
│  └─ android.yml            안드로이드 APK/AAB 자동 빌드
└─ tools/                    아이콘·폰트 다시 만들 때 쓰는 스크립트
```

---

## 1단계: PWA로 바로 설치하기 (무료, 오늘 가능)

PWA는 https 주소에 올려야 폰에서 설치 버튼이 나옵니다.

1. GitHub에서 새 저장소를 만듭니다. 예: `malang-pet-house`
2. 이 폴더를 그 저장소에 올립니다(push).
3. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꿉니다.
4. **Actions** 탭에서 "Deploy PWA to GitHub Pages"가 초록색이 되면 주소가 나옵니다.
   예: `https://아이디.github.io/malang-pet-house/`

**폰에 설치하기**
- **안드로이드(크롬):** 주소 열기 → 오른쪽 위 ⋮ → **앱 설치** (또는 아래에 뜨는 설치 배너)
- **아이폰(사파리):** 주소 열기 → 아래 공유 버튼 → **홈 화면에 추가**

한 번 열고 나면 인터넷 없이도 실행됩니다.

---

## 2단계: 구글 플레이 출시

### 방법 A — GitHub Actions로 빌드 (이 폴더에 이미 준비됨)
1. 저장소를 올리면 **Actions → Android build** 가 자동 실행됩니다. (직접 실행하려면 Run workflow)
2. 끝나면 실행 화면 아래 **Artifacts** 에서 `malang-pet-debug-apk` 를 받습니다.
   → 안드로이드 폰에 옮겨 설치하면 테스트할 수 있습니다. (설정에서 "출처를 알 수 없는 앱" 허용 필요)
3. **플레이 스토어용 서명 파일(AAB)** 을 만들려면 업로드 키가 필요합니다.
   - 키 만들기 (Java가 설치된 PC 또는 Android Studio에서 한 번만):
     ```bash
     keytool -genkeypair -v -keystore upload.jks -alias malang -keyalg RSA -keysize 2048 -validity 10000
     ```
   - 저장소 **Settings → Secrets and variables → Actions** 에 4개 등록:
     `ANDROID_KEYSTORE_BASE64`(upload.jks를 base64로 바꾼 글자), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`(위 예시는 malang), `ANDROID_KEY_PASSWORD`
   - 다시 빌드하면 `malang-pet-release-aab` 가 함께 나옵니다.
   - ⚠️ `upload.jks` 와 비밀번호는 잃어버리면 앱 업데이트가 어려워지니 안전한 곳에 따로 보관하세요. 저장소에는 절대 올리지 마세요(.gitignore에 막아 둠).

### 방법 B — PWABuilder (코딩 없이)
1단계의 https 주소를 [pwabuilder.com](https://www.pwabuilder.com) 에 넣으면 플레이 스토어용 패키지를 만들어 줍니다.

### 플레이 콘솔 등록 시 주의
- **앱 ID** 는 `capacitor.config.json` 의 `appId`(현재 `com.malangpet.house`)입니다. 출시 전에 본인만의 이름으로 바꾸고, 출시 후에는 바꿀 수 없습니다.
- **개인 개발자 신규 계정** 은 정식 출시 전에 테스터 여러 명과 일정 기간 비공개 테스트를 거쳐야 합니다. 2023년 말부터 생긴 규칙이고 기준(인원·기간)은 바뀔 수 있으니, 등록할 때 플레이 콘솔 안내를 확인하세요.
- **대상 연령에 어린이를 포함** 하면 "가족 정책(Families)" 요건이 적용됩니다. 이 게임은 광고·결제·데이터 수집이 없어서 요건을 맞추기 쉽습니다.
- **데이터 보안 양식:** "수집하는 데이터 없음, 공유하는 데이터 없음"으로 답하면 됩니다.
- **개인정보처리방침 URL:** `https://아이디.github.io/malang-pet-house/privacy.html`
  (먼저 `www/privacy.html` 안의 `YOUR-EMAIL@example.com` 을 본인 문의 메일로 바꾸세요.)

---

## 3단계: 애플 앱스토어 출시

아이폰 앱은 **Mac의 Xcode** 로만 빌드·업로드할 수 있습니다. (Mac이 없으면 Codemagic 같은 클라우드 Mac 서비스를 쓸 수 있습니다.)

1. [Apple Developer Program](https://developer.apple.com/programs/) 가입 (연 99달러)
2. Mac에 Node.js와 Xcode를 설치하고 이 폴더에서:
   ```bash
   npm install
   ```
   ```bash
   npx cap add ios
   ```
   ```bash
   npx @capacitor/assets generate --ios --iconBackgroundColor "#DDF4EA" --splashBackgroundColor "#DDF4EA"
   ```
   ```bash
   npx cap open ios
   ```
3. Xcode에서 **Signing & Capabilities → Team** 에 개발자 계정 선택 → **Product → Archive** → **Distribute App** 으로 업로드
4. [App Store Connect](https://appstoreconnect.apple.com) 에서 스크린샷·설명·개인정보처리방침 URL 입력 후 심사 요청

### 앱스토어 심사 주의
- **키즈 카테고리** 를 고르면 외부 광고·분석 도구 금지, 외부 링크 앞 보호자 확인 등 규칙이 있습니다. 이 게임은 광고·분석·외부 링크가 없습니다.
- 애플은 "웹사이트를 감싸기만 한 앱"을 거절할 수 있습니다(가이드라인 4.2). 이 게임은 기기 안에서 오프라인으로 돌아가는 완성된 게임이라 해당 가능성이 낮지만, 심사 메모에 "오프라인 게임이며 모든 파일이 앱 안에 들어 있음"이라고 적어 두면 좋습니다.

---

## 게임을 고친 뒤 다시 내보내기

1. `www/index.html` 수정
2. `www/sw.js` 맨 위의 `VERSION` 을 `malang-v2` 처럼 올리기 (이미 설치한 폰도 새 버전을 받게 됨)
3. 저장소에 올리면 웹앱은 자동 갱신, 안드로이드는 Actions가 새 APK/AAB를 만듭니다. (versionCode는 빌드 번호로 자동 증가)
4. 아이폰은 Mac에서 `npx cap sync ios` 후 다시 Archive

## 도구 스크립트

```bash
python tools/make_fonts.py
```
게임 글자를 바꿨을 때 폰트를 다시 만듭니다. (fonts-src/의 원본 TTF 필요)

```bash
python tools/make_icons.py serve
```
아이콘을 다시 그립니다. 실행 후 브라우저로 http://127.0.0.1:8770/ 을 열면 `www/icons` 와 `assets` 가 새로 만들어집니다.

## 라이선스
- 폰트: Jua, Gowun Dodum — SIL Open Font License 1.1 (`www/fonts/OFL-*.txt`)
- 캐릭터·게임 코드: 이 프로젝트의 오리지널 작업물
