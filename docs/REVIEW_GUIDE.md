# 말랑 영어 펫하우스: 코드 검토 안내서

검토하시는 분이 짧은 시간에 구조를 파악할 수 있도록 정리한 문서입니다. (2026-11-10, 커밋 `22eb21c` 기준)

## 1. 한눈에 보기

- **무엇인가**: 어린이(5~13세)와 어른이 3D 펫을 키우며 영어를 배우는 게임. 웹(PWA)과 안드로이드·iOS 앱(Capacitor)으로 배포.
- **서버 없음**: 모든 데이터는 기기 안(`localStorage`)에만 저장. 계정·광고·결제·분석 도구·외부 통신 없음.
- **기술**: 순수 HTML·CSS·JavaScript 한 파일 + Three.js r128(3D). 빌드 도구 없이 바로 실행.
- **배포 주소**: https://gqeq33-glitch.github.io/malang-pet-house/

## 2. 실행과 시험

| 하는 일 | 명령 |
|---|---|
| 자동 시험 | `npm test` (Node 18 이상) |
| 배포 전 점검 | `node tools/check_release.js` (필수 파일·문법·GLB·설정, 출시 직전엔 `--release`) |
| 브라우저 첫 화면 시험 | `node tools/smoke_test.js` (크롬 필요, 휴대폰·PC 크기) |
| 로컬 실행 | `www` 폴더에서 `python -m http.server 8000` → http://localhost:8000 |
| 안드로이드 빌드 | GitHub에 올리면 `.github/workflows/android.yml`이 자동 실행 (설치 → 시험 → 점검 → 브라우저 시험이 모두 통과해야 빌드) |
| iOS 빌드 확인 | `.github/workflows/ios.yml` (서명 없는 시뮬레이터 빌드) |
| 웹 배포 | `.github/workflows/pages.yml` (GitHub Pages) |

> 파일을 더블클릭해서(`file://`) 열면 브라우저 보안 때문에 3D 모델(GLB)을 못 읽어 예전 곰이 나옵니다. 위처럼 로컬 서버로 여세요.

## 3. 폴더 구조

```
www/                 실제 앱 (이 폴더가 그대로 배포됨)
  index.html         게임 전체 (약 8,600줄, 752KB)
  sw.js              오프라인 캐시 (VERSION을 올려야 기존 설치본이 갱신됨)
  privacy.html       개인정보처리방침 (한국어·영어)
  manifest.webmanifest, icons/, fonts/
  vendor/three.min.js, vendor/GLTFLoader.js   three.js r128 (MIT)
  models/malang_bear.glb, models/malang_plaza.glb   직접 만든 3D 모델
tests/               node:test 자동 시험 (security, ui, content)
tools/               보조 도구 (코드 복사 페이지, 검수 CSV, 아이콘, 글꼴, 3D 에셋 제작기)
docs/                설계·검수·출시 문서
.github/workflows/   Android·iOS·Pages 자동 빌드
```

## 4. `www/index.html` 안의 구성

한 파일이지만 영역별로 나뉘어 있습니다. 줄 번호는 바뀔 수 있으니 함수 이름으로 검색하세요.

| 영역 | 찾을 이름 | 내용 |
|---|---|---|
| 보안 설정 | `Content-Security-Policy` | 외부 연결 차단. `connect-src 'self' blob:` (blob은 GLB 안의 그림 읽기용) |
| 저장 | `saveGuard`, `migrateSave`, `load`, `persist` | 저장 데이터 검증(허용 목록·범위·형식), 버전 이전, 손상 시 복구 |
| 3D 세계 | `const World = (() =>` | 집·마을·점프 코스, 펫 모델과 동작, 카메라, 입력 |
| 펫 모델 | `buildPet`, `poseLimbs`, `PET3` | 12종 펫을 코드로 생성. 곰은 GLB 모델 우선 |
| 새 그래픽 | `glbBearInto`, `usePlaza`, `loadGlb`, `GLB_FACE` | GLB 불러오기, 실패 시 예전 모습으로 대체 |
| 영어 데이터 | `const ENG = [`, `ENG_META` | 6단계 72레슨, 단어·문장·빈칸·대화·읽기 |
| 영어 엔진 | `engMark`, `engQuiz`, `engAdultQuiz`, `engLesson`, `engReviewQuiz` | 문제 15유형, 간격 복습(10분→1→3→7→14→30일), 약한 단어 쉽게 |
| 영어 게임 | `EG_LIST`, `egShell`, `egFinish`, `egAlphabet` 등 | 영어 게임 9종 |
| 이야기 | `const SAGA =`, `STORIES` | 이야기 모험 8장, 이야기 극장 3편 |
| 보상 | `studyMark`, `boundedReward`, `engCheckGoals` | 누적 학습(쉬어도 줄지 않음), 횟수 제한 보상 |
| 보호자 | `parentGate`, `openParent`, `openEngReport`, `playTick`, `pinSave`, `hasRecovery` | 보호자 확인, PIN과 복구 코드, 놀이 시간·휴식·밤 시간 제한, 학습 결과, 앱 안 개인정보처리방침 |
| 소리 | `MUSIC_TUNES`, `sfx(` | 직접 합성한 음악과 효과음 (외부 음원 없음) |
| 소식 | `const NEWS =` | 업데이트 소식 |

## 5. 저장 데이터

- 키: `malang-pet-house-v1`, 형식 버전 `v: 1`, 스키마 버전 `sv: 2`.
- 모든 항목은 `saveGuard`의 허용 목록에 있어야 하며, 새 항목은 **선택 항목으로만** 추가합니다(기존 이용자 기록 보존).
- 백업 코드 가져오기·친구 코드도 같은 검증을 거칩니다. 위조 값(범위 밖 숫자, 모르는 키, HTML 문자)은 거부합니다.

## 6. 3D 모델 (최근 변경)

- `models/malang_bear.glb`: 관절 노드(`MB_head`, `MB_armL/R`, `MB_legL/R`, `MB_earL/R`, `MB_tail`), 얼굴 그림(`MB_eyeL/R`, `MB_mouth`), 애니메이션 10개. 삼각형 약 15,400개.
- 게임은 GLB의 관절을 기존 동작 코드(`poseLimbs`)로 움직이고, 표정은 눈·입 그림을 바꿔 보여 줍니다.
- 모델을 못 불러오면 `console.warn`만 남기고 예전 코드 곰과 예전 분수를 그대로 씁니다. 설정의 "새 그래픽"을 끄면 예전 그래픽으로 돌아갑니다(`S.gfxOld`).
- 모델은 외부 서비스 없이 `tools/assetmaker`로 직접 만들었습니다. 자세한 내용은 `docs/ASSETS.md`.

## 7. 자동 시험이 확인하는 것

- **security**: 저장 검증(정상 통과·위조 거부), 보호자 PIN, 채팅·외부 통신 없음, CSP, 개인정보처리방침 내용.
- **ui**: 대표 캐릭터 연결, 색 대비, 글씨 크기, 게임·메뉴 연결, 음악 데이터, GLB 파일 구조(머리말·노드·애니메이션·크기), 오프라인 캐시 목록.
- **content**: 영어 데이터 형식, 중복, 뜻 충돌, 정답과 오답 겹침, a/an·대문자·미국식 표기, 레슨별 카테고리.

## 8. 최근 변경 (최신순)

| 커밋 | 내용 |
|---|---|
| `22eb21c` | 직접 만든 말랑 베어·마을 광장 GLB 적용, 실패 시 대체, 예전 그래픽 설정 |
| `1357bef` | 대표 캐릭터 2종 디자인, 새 표정·동작, 영어 메인 화면 7개 메뉴 |
| `dbc31bc` | 누적 학습 보상, 복습 간격, 보호자 학습 결과, 어른 영어 14레슨 |
| `3a5e624` | 영어 콘텐츠 품질 관리 |
| `f361442` | 이야기 모험과 영어 게임 4종 |

## 9. 알려진 한계 (검토 때 참고)

- **실기기 미검증**: 실제 휴대폰에서의 속도, 소리, 오프라인 동작은 아직 측정하지 않았습니다. 자동 빌드 성공까지만 확인했습니다.
- **콘텐츠 검수 전**: 영어 문장은 교사·원어민 검수를 받지 않았습니다(`docs/CONTENT_REVIEW.md`).
- **한 파일 구조**: `index.html` 하나에 기능이 모여 있어 길고, 화면·규칙·그리기가 섞인 부분이 있습니다. 그리기(3D)부터 분리하는 것을 다음 정리 후보로 봅니다.
- **곰 모델 폴리곤**: 목표(8천~1.2만)보다 조금 많습니다(약 1.5만).
- **보호자 확인의 한계**: 곱셈 문제는 성인 인증이 아닙니다. PIN을 만들면 복구 코드로만 PIN을 지울 수 있지만, 기기 저장 데이터를 지울 수 있는 사람까지 막지는 못합니다. 복구 코드가 생기기 전에 만든 PIN은 10분 대기 후 곱셈으로 지울 수 있습니다.
- **운영자 연락처**: 개인정보처리방침의 문의 메일이 아직 자리표시(`YOUR-EMAIL@example.com`)입니다. `python tools/set_contact_email.py 주소`로 넣습니다.
- **결제 없음**: 유료 기능은 설계 문서(`docs/STORE_SUBMISSION.md`)만 있고 구현하지 않았습니다.

## 10. 특히 봐 주시면 좋은 곳

1. `saveGuard`: 새 항목을 넣을 때 빠진 검증이 없는지
2. `glbBearInto` / `usePlaza`: GLB 재질 바꾸기와 메모리(복제·재질 캐시)가 적절한지
3. `engLesson`의 채점과 복습 기록(`engMark`)이 맞는지
4. 어린이 안전: 외부 링크·결제·개인정보 입력이 생기지 않았는지, 보호자 시간 제한(`playTick`)이 우회되지 않는지
