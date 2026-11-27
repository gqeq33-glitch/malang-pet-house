# 사람 주인공 + 펫 동반 — 설계와 에셋 검증 (P1 4번, 2026-11-27)

> 사용자 결정(2026-11-26): **사람 주인공 + 펫 동반**, **무료 CC0 모델**.
> 이 문서는 설계와 검증까지만 다룬다. **게임 코드는 아직 바꾸지 않았다.** 펫 시스템은 그대로 둔다.

## 1. 에셋 검증 결과 — Kenney *Mini Characters* 2.0
| 항목 | 확인 내용 |
|---|---|
| 출처 | kenney.nl/assets/mini-characters (공식), 파일 `kenney_mini-characters.zip` 4,024,187바이트 (2026-11-27 받음) |
| 라이선스 | 압축 안 `License.txt`: **CC0 1.0** — 개인·교육·상업 사용 가능, 출처 표기 의무 없음(표기 권장: "Kenney") |
| 구성 | 사람 13명(female-a~f, male-a~g) + 직업/특수 7명(alien·knight·raider·robot·soldier·worker·zombie) + 소품 23개. 형식 GLB·FBX·OBJ 모두 |
| 뼈대 | 모든 캐릭터 같은 뼈대 7개: `root, leg-left, leg-right, torso, arm-left, arm-right, head` (SkinnedMesh 2개: 몸·머리) |
| 동작 | 캐릭터마다 **31개 동작 + static**: idle, walk, sprint, jump, fall, crouch, sit, drive, pick-up, emote-yes, emote-no, interact-left/right, holding-*, 휠체어 동작 7개 등 |
| 무게 | 캐릭터 1명 GLB 약 235~280KB, 삼각형 약 700~900개(곰 GLB는 약 1만 800개). 텍스처는 `colormap.png` **1장을 모두 공유** |
| three.js r128 | 게임과 같은 `three.min.js`·`GLTFLoader.js`로 화면 없는 크롬에서 실제로 열고 `AnimationMixer`로 idle·walk·emote-yes 재생 확인, 오류 없음 |

검증 화면: `docs/human-assets/kenney_with_bear.png`(사람 2명 + 말랑 곰), `docs/human-assets/kenney_all_people.png`(사람 14명).

### 발견한 점
- **female-a**는 팔 쪽에 파란 조각이 늘어나 보인다(Kenney 미리보기에도 비슷하게 보임). → 후보에서 뺀다.
- 그림체: Kenney는 **각진 블록형**, 말랑 곰은 **둥근 말랑형**이다. 함께 세워 보면 어색하지 않지만 완전히 같은 스타일은 아니다. 재질을 게임 쪽 부드러운 재질(`glbMat`과 같은 방식)로 바꾸고 외곽 색을 맞추면 차이가 줄어든다 — 실제 적용 후 화면으로 다시 판단.
- 어린이 게임에 맞지 않는 것 제외: soldier·raider·zombie·무기 소품(weapon-*, shield-*), 안대 캐릭터(male-f)는 쓰지 않는다.
- 다양성 장점: 휠체어·지팡이·보청기 소품이 들어 있어 포용적인 NPC를 만들 수 있다.

### 추천 사용
- **주인공 고르기(4명)**: female-b, female-c, male-a, male-c — 아이가 처음에 고른다(이름은 기존 `cleanName` 규칙).
- **마을 사람 NPC 후보**: male-b(빵집), male-e(우체국), female-d(꽃집), worker(공사장), male-g(경찰), female-e·female-f(친구).
- 게임에 넣을 파일: 캐릭터 GLB 여러 개 + `colormap.png` 1장. 6명이면 약 1.6MB(GLB를 하나로 합치면 더 줄일 수 있음).

## 2. 설계 — 사람 주인공 + 펫 동반
### 화면과 조작
- 지금은 아이가 **펫을 직접 움직인다**(`st`·`drive`, 1509행). 바꾼 뒤에는 **주인공을 움직이고, 펫이 뒤를 따라온다**.
- **집 안은 그대로 펫 중심**(밥·목욕·잠·놀이 버튼이 펫 돌보기라 바꾸면 기존 기능을 해친다). 주인공은 집 안에서 옆에 서 있다.
- **마을·모험에서 주인공이 걸어 다닌다.** 펫은 1.2m 뒤를 따라오고, 멈추면 옆에 와서 앉는다. 탈것(`ride`)은 기존처럼 펫이 탄다.
- 카메라: 주인공을 따라가되 펫도 화면에 들어오게 조금 뒤로.

### 동작 연결 (Kenney 동작 이름)
| 게임 상태 | 주인공 | 펫(곰 GLB) |
|---|---|---|
| 서 있음 | idle | idle |
| 걷기 / 달리기 | walk / sprint | walk / run (이미 구현) |
| 점프 | jump → fall | jump |
| NPC와 대화 | interact-right | wave |
| 정답 | emote-yes | happy/dance |
| 오답 | emote-no | sad |
| 물건 줍기(퀘스트) | pick-up | surprised |
| 앉아 쉬기 | sit | sleep |
재생은 P1 3번에서 만든 방식(동작 이름 → `clipAction`, 0.22초 섞기, 바꿀 때 `stopAllAction`·`uncacheRoot`)을 그대로 쓴다.

### 저장(호환 유지)
- 새 칸 `hero: { look: 'female-b', name: '…' }` 하나만 추가. 없으면(예전 저장) **사람 고르기 화면을 한 번 보여 주고**, 그동안 게임은 예전처럼 동작.
- `saveGuard` 허용 목록에 `hero` 추가: `look`은 허용 목록 4개 중 하나만, `name`은 `cleanName`. 틀리면 `hero`만 빼고 통과(기존 규칙과 같음). `SAVE_VERSION`은 올리지 않아도 됨(선택 칸).
- 백업 코드 왕복 시험, 예전 저장 불러오기 시험 추가.

### 바꾸지 않는 것
펫 12종 성장·꾸미기, 레슨·영어 게임, 미니게임, 퀘스트, 보호자 메뉴, 저장 구조, 오프라인·무결제 구조, NPC 동물 친구 8명(사람 NPC는 **추가**만).

## 3. 다음 단계(구현 순서, 단계마다 시험·보고)
1. 모델 파일 넣기: `www/models/people/`에 GLB 4~6개 + `colormap.png`, 라이선스 파일 동봉, 서비스 워커 캐시 목록 갱신. **(내려받은 원본은 아직 프로젝트에 넣지 않았다 — 작업용 폴더에만 있음)**
2. 마을에서만 주인공 표시 + 펫 따라오기 (집 안은 그대로) — 기존 조작 유지 옵션(설정에서 "펫 조종하기") 남겨 두기.
3. 사람 고르기 화면 + 저장 `hero` + 시험.
4. 사람 NPC 2명(빵집·우체국)과 영어 대화 퀘스트 1개 → P1 5번과 연결.
5. 브라우저 확인, 출시 점검, 스모크 시험. **실기기 FPS·메모리는 사용자 휴대폰에서 따로 확인 필요.**

## 4. 아직 검증하지 못한 것
- 실제 게임 화면(마을 조명·그림자·저사양 재질) 안에서의 모습 — 위 그림은 별도 시험 화면.
- 휴대폰에서 사람 + 펫 + NPC가 함께 있을 때의 FPS·메모리.
- 다른 후보(Quaternius, 사실적 비율)는 이번에 받지 않았다.

## 5. 구현 1차 (2026-11-27)
- 들어간 것: `www/models/people/`(주인공 4명 GLB·초상화·colormap·CC0 라이선스), 서비스 워커 `malang-v40`(선택 파일로 캐시).
- 주인공: 하나(female-b)·소라(female-c)·준(male-a)·민(male-e, male-c는 어른 경찰이라 교체) + "펫만".
- 처음 마을에 들어가면 고르기 화면, 설정 → "🧒 마을 주인공"에서 바꾸기. 저장 칸 `hero`(검사 목록 통과 값만).
- 마을에서만 주인공 표시(집 안·장애물 코스·둘이 하기·탈것·경주는 예전 그대로). 펫은 걸을 때 지나간 길 옆을, 멈추면 주인공 오른쪽 옆에 선다. 말풍선은 펫 위.
- 주인공 동작: idle·walk·sprint·jump·interact-right(대화)·emote-yes/no(재주). 텍스처는 게임 렌더러에 맞춰 선형으로 읽음.
- 확인: `npm test` 123/123, 출시 점검·스모크 시험 통과, 화면 없는 크롬에서 고르기→저장→걷기(sprint)→멈춤(idle) 확인. GLTFLoader 경고 1건(KHR_texture_transform 일부 미지원)은 화면에 문제 없음.
- **실기기 FPS·메모리·터치 확인은 아직 안 함.** 사람 NPC·영어 퀘스트는 다음 단계(P1 5번).
