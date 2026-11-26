# 말랑 영어 펫하우스 — 구글 플레이 출시 체크리스트 (2026-11-26)

> 정책·비용은 바뀔 수 있으니 등록할 때 Play Console 화면의 안내를 기준으로 다시 확인한다.

## ✅ 준비 완료 (이번에 한 것 포함)
| 항목 | 내용 |
|---|---|
| **대상 Android 버전** | Google Play는 2026-08-31부터 새 앱·업데이트에 **Android 16(API 36)** 을 요구한다. Capacitor 7(API 35)이라 거절될 상태였음 → **Capacitor 8.6으로 올림(API 36)**, CI Node 22, iOS 빌드는 Xcode 26 러너(macos-26) |
| 자동 시험 | `npm test` 118/118, 출시 점검, 브라우저 스모크 시험 통과 (업그레이드 후 재실행) |
| 휴대폰 스크린샷 | `docs/store-screenshots/play_1_home.png` ~ `play_4_village.png` (1080×1920, 실제 게임 화면) — `node tools/store_shots.js`로 다시 만들 수 있음 |
| 그래픽 이미지 | `docs/store-screenshots/play_feature_1024x500.png` |
| 앱 아이콘 | `www/icons/icon-512.png` (512×512) |
| 소개 문구(한·영) | `docs/STORE_SUBMISSION.md` 2장 |
| 개인정보처리방침 | https://gqeq33-glitch.github.io/malang-pet-house/privacy.html (문의 이메일만 비어 있음) |
| 서명된 AAB 자동 빌드 | GitHub에 서명 키 비밀값 4개가 있으면 Android 빌드가 `malang-pet-release-aab` 결과물을 만든다 |
| 광고·추적·채팅 | 없음(가족 정책에서 가장 까다로운 부분이 해당 없음) |

## 🔲 사용자가 해야 할 것 (순서대로)
1. **고용센터(1350) 확인** — 육아휴직 중 앱 판매·수입이 급여에 영향을 주는지.
2. **지원 이메일 정하기** — 개인정보처리방침과 스토어에 공개된다. 정해 주시면 `python tools/set_contact_email.py 주소`로 넣는다.
3. **Google Play 개발자 계정 가입** — 1회 등록비(현재 USD 25로 알려져 있음, 결제는 직접), 본인 신원 확인.
   - 새 개인 계정은 **정식 출시 전에 비공개 테스트(테스터 여러 명, 일정 기간)** 를 요구할 수 있다(현재 12명·14일로 알려져 있음, 가입 후 콘솔 안내 확인). → 지인·가족 테스터를 미리 모아 두기.
4. **업로드 키 만들기** — `tools\make_upload_key.cmd` 더블클릭 → 비밀번호 입력 → GitHub 비밀값 4개 자동 등록. 키 파일(`Documents\malang_secrets\malang-upload.jks`)과 비밀번호는 **따로 백업**.
5. 키 등록 후 GitHub에 올리면(“올려 줘”) Android 빌드가 **서명된 AAB**를 만든다 → Play Console 비공개 테스트 트랙에 업로드.
6. Play Console 설문: 대상 연령(어린이 포함 → 가족 정책), 콘텐츠 등급, 데이터 보안(수집 없음·기기 저장), 광고 없음 — 답변 초안은 `docs/STORE_SUBMISSION.md` 3~5장.

## ⚠️ 출시 전 남은 품질 항목
- 실제 휴대폰 시험(터치·소리·저장) — 아직 안 함
- 영어 내용 전문가 검수(`docs/CONTENT_REVIEW.md`) — 권장
- 패키지 ID `com.malangpet.house`는 출시 후 바꿀 수 없음 → 이대로 확정할지 결정
