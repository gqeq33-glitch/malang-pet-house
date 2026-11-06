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
