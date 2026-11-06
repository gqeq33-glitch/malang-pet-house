// 캐릭터 연결과 화면 기준을 확인한다. 실행: node --test tests/ui.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
const order = html.match(/const SPECIES_ORDER = \[([^\]]+)\]/)[1].match(/[a-z]+/g);

test('대표 캐릭터 4종이 맨 앞에 있고 첫 화면에서 고를 수 있다', () => {
  assert.deepEqual(order.slice(0, 4), ['bear', 'bunny', 'dragon', 'fox']);
  assert.ok(html.includes('const START_SPECIES = SPECIES_ORDER.slice(0, 5)'));
});
test('모든 캐릭터에 2D와 3D 데이터가 있다', () => {
  const sp = html.slice(html.indexOf('const SPECIES = {'), html.indexOf('const SPECIES_ORDER'));
  const pet3 = html.slice(html.indexOf('const PET3 = {'), html.indexOf('};', html.indexOf('const PET3 = {')));
  for (const id of order) {
    assert.ok(new RegExp(`\\n  ${id}: \\{`).test(sp), '2D ' + id);
    assert.ok(new RegExp(`\\n    ${id}: +\\{`).test(pet3), '3D ' + id);
    assert.ok(html.includes(`spId === '${id}'`), '조립 ' + id);
  }
});
test('필요한 동작과 표정이 모두 있다', () => {
  for (const t of ['sad', 'surprise', 'explain', 'cheer', 'jump', 'hop']) assert.ok(new RegExp(`TRICK_LEN = \\{[^}]*\\b${t}:`).test(html), t);
  for (const m of ['surprise', 'talk', 'sleep', 'happy', 'sad']) assert.ok(html.includes(`'${m}'`), m);
});
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
test('글자 색 대비가 충분하다', () => {
  for (const bg of ['#FFF8E9', '#FFFFFF', '#80DDBB', '#FFD36E', '#FF967F', '#75CFFF', '#BDA6F6']) assert.ok(ratio('#35435A', bg) >= 4.5, bg + ' ' + ratio('#35435A', bg));
  assert.ok(ratio('#5E6A80', '#FFFFFF') >= 4.5);
  assert.ok(ratio('#5E6A80', '#FFF8E9') >= 4.5);
});
test('팔레트가 적용됐고 13px보다 작은 글씨가 없다', () => {
  const css = html.slice(html.indexOf('<style>\n@font-face'), html.indexOf('</style>', html.indexOf('<style>\n@font-face')));
  for (const v of ['--wall:#FFF8E9', '--sky:#75CFFF', '--mint:#80DDBB', '--butter:#FFD36E', '--lav:#BDA6F6', '--coral:#FF967F', '--ink:#35435A']) assert.ok(css.includes(v), v);
  assert.deepEqual(css.match(/font-size:(?:1[0-2]|[0-9])(?:\.\d+)?px/g), null);
  assert.ok(css.includes('min-height:44px'));
});
test('없는 그림 파일을 가정하지 않는다', () => {
  assert.ok(!/src="[^"]*(bear|mascot|sprite)[^"]*\.(png|webp|glb|gltf)/.test(html));
});
test('영어 음성: 자연스러운 음성을 먼저 고르고, 영어 음성이 없으면 다른 언어로 읽지 않는다', () => {
  const a = html.indexOf('const voiceLang = v =>'), b = html.indexOf('const engVoices = ()', a);
  const ctx = {};
  require('node:vm').createContext(ctx);
  require('node:vm').runInContext(html.slice(a, b) + ';this.voiceScore = voiceScore;', ctx);
  const rank = list => list.map(n => ({ name: n, lang: 'en-US' })).sort((x, y) => ctx.voiceScore(y) - ctx.voiceScore(x))[0].name;
  assert.equal(rank(['Microsoft Zira - English (United States)', 'Google US English']), 'Google US English');
  assert.equal(rank(['Google US English', 'Microsoft Aria Online (Natural) - English (United States)']), 'Microsoft Aria Online (Natural) - English (United States)');
  assert.ok(ctx.voiceScore({ name: 'x', lang: 'en_US' }) >= 10);
  assert.ok(html.includes("if (lang.startsWith('en') && noEngVoice()) { warnNoEngVoice(); return; }"));
});
test('영어 게임 3종이 메뉴에 연결되어 있고 코인 보상에 한도가 있다', () => {
  for (const f of ['function egAlphabet', 'function egCatch', 'function egMatch', 'function openEngGames']) assert.ok(html.includes(f), f);
  assert.ok(html.includes("boundedReward('eg:' + key, 10, 5)"));
  const g = html.slice(html.indexOf('function egShell'), html.indexOf('function openEngGames'));
  assert.ok(!/S\.coins\s*-=/.test(g), '게임에서 코인을 빼앗지 않는다');
});
test('문장 기차·보물찾기·오늘의 미션이 연결되어 있다', () => {
  for (const f of ['function egTrain', 'function startWordHunt', 'function dayWordsQuiz', 'huntStart(list, cb)', 'huntStop()', "de.words = true", 'de.game = true', 'DAY_PET_XP']) assert.ok(html.includes(f), f);
  const h = html.slice(html.indexOf('function startWordHunt'), html.indexOf('function openEngGames'));
  assert.ok(!/setInterval|S\.coins\s*-=/.test(h), '시간제한과 코인 차감이 없다');
  const d = html.slice(html.indexOf('function dayEngState'), html.indexOf('/* ---------- 사용자 시험용 기록'));
  assert.ok(!/streak|연속/.test(d), '연속 기록이 없다');
});
const vmx = require('node:vm');
function musicData() {
  const a = html.indexOf('const MAJOR = ['), b = html.indexOf('// 음계에서 3도 위 화음 음', a), c = {};
  vmx.createContext(c); vmx.runInContext(html.slice(a, b) + ';this.T = MUSIC_TUNES;', c); return c.T;
}
const mod12 = x => ((x % 12) + 12) % 12;
test('음악: 길이가 맞고 음이 조성 안에 있으며, 강박은 코드와 어울린다', () => {
  const T = musicData();
  for (const k of ['house', 'village', 'obby', 'learn', 'game', 'sleep']) assert.ok(T[k], k);
  for (const [k, t] of Object.entries(T)) {
    assert.equal(t.mel.length, t.chords.length * 8, k + ' 멜로디 길이');
    let strong = 0, good = 0;
    t.mel.forEach((m, i) => {
      if (m === null) return;
      assert.ok(t.scale.includes(mod12(m)), `${k} ${i}번째 음 ${m}이 조성 밖이에요`);
      if (i % 4 === 0) { const [r, q] = t.chords[Math.floor(i / 8)], tri = [r, r + (q === 'm' ? 3 : 4), r + 7].map(mod12); strong++; if (tri.includes(mod12(m))) good++; }
    });
    assert.equal(good, strong, k + ' 강박 음이 코드와 맞지 않아요');
    for (const [r, q] of t.chords) { assert.ok(t.scale.includes(mod12(r)), k); assert.ok(t.scale.includes(mod12(r + (q === 'm' ? 3 : 4))), k + ' 코드 음'); assert.ok(t.scale.includes(mod12(r + 7)) || r === 11, k + ' 코드 5음'); }
    const notes = t.mel.filter(m => m !== null).map(m => t.tonic + m);
    assert.ok(Math.min(...notes) >= 55 && Math.max(...notes) <= 90, k + ' 음역');
    assert.ok(t.bpm >= 50 && t.bpm <= 150, k + ' 빠르기');
  }
});
test('게임에서 부르는 효과음이 모두 만들어져 있다', () => {
  const fx = html.slice(html.indexOf('const SND_FX = {'), html.indexOf('const SND_VOL'));
  const kinds = new Set([...html.matchAll(/\bsfx\('([a-zA-Z]+)'\)/g)].map(m => m[1]));
  assert.ok(kinds.size >= 10);
  for (const k of kinds) assert.ok(new RegExp(`\\n  ${k}\\(b, t\\)`).test(fx), k);
});
test('소리: 외부 파일을 쓰지 않고, 영어 음성은 효과음 설정과 분리되어 있다', () => {
  assert.ok(!/\.(mp3|ogg|wav|m4a)["']/.test(html));
  const a = html.slice(html.indexOf('function engSay'), html.indexOf('function engSay') + 200);
  assert.ok(!a.includes('S.sound'));
  assert.ok(html.includes('SND_VOL') && html.includes("id=\"setMusicVol\""));
});
test('음악: 놀이 곡은 16마디 이상이고 밝은 장조이며 장면마다 다르다', () => {
  const T = musicData();
  for (const k of ['house', 'village', 'obby', 'game']) { assert.ok(T[k].chords.length >= 16, k); assert.ok(T[k].scale.includes(4) && !T[k].scale.includes(3), k + ' 장조'); assert.ok(T[k].bpm >= 100, k); assert.ok(T[k].sparkle, k); }
  const mels = Object.values(T).map(x => x.mel.join());
  assert.equal(new Set(mels).size, mels.length);
  assert.ok(html.includes('function openSoundTest'));
});
test('영어 게임 9종이 목록에 모두 연결되어 있고, 발음 게임은 마이크를 쓰지 않는다', () => {
  for (const k of ['abc', 'catch', 'match', 'train', 'hunt', 'cafe', 'jungle', 'story', 'speak']) assert.ok(html.includes(`row('${k}'`), k);
  assert.ok(!/getUserMedia|SpeechRecognition/.test(html));
  const g = html.slice(html.indexOf('function egCafe'), html.indexOf('function openEngGames'));
  assert.ok(!/S\.coins\s*-=/.test(g));
});
test('이야기 모험이 지도와 놀이 메뉴에 있고, 게임이 끝나면 이야기로 돌아온다', () => {
  for (const f of ['function openSaga', 'function sagaPlay', 'function sagaEnd', 'id="eSaga"', 'data-game="saga"', 'if (sagaAfter)', 'cat.sagaLen']) assert.ok(html.includes(f), f);
});
