// 영어 내용의 기계적 품질 검사. 번역과 발음의 정확성은 사람이 봐야 하므로 이 테스트로 "검수 완료"가 되지는 않는다.
// 실행: node --test tests/content.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
const a = html.indexOf('const ENG = ['), b = html.indexOf('// 레슨별 학습 정보', a);
const ctx = {};
vm.createContext(ctx);
vm.runInContext(html.slice(a, b) + '\nthis.ENG = ENG;', ctx);
const ENG = ctx.ENG;
const units = ENG.flatMap((st, si) => st.units.map(u => Object.assign({ si }, u)));
// 실제로 뜻이 여러 개인 단어 (orange: 오렌지·주황, cook: 요리하다·요리사)
const HOMONYM = new Set(['orange', 'cook']);
const EN = /^[\x20-\x7e]+$/, KO = /[가-힣]/;

test('레슨 번호가 겹치지 않는다', () => {
  const ids = units.map(u => u.id);
  assert.equal(new Set(ids).size, ids.length);
});
test('단어: 영어와 뜻이 있고, 같은 단어의 뜻이 레슨마다 다르지 않다', () => {
  const seen = new Map(), bad = [];
  for (const u of units) {
    const inUnit = new Set();
    for (const [w, k] of u.w || []) {
      if (!EN.test(w) || !KO.test(k)) bad.push(['형식', u.id, w]);
      if (inUnit.has(w)) bad.push(['레슨 안 중복', u.id, w]);
      inUnit.add(w);
      if (seen.has(w) && seen.get(w) !== k && !HOMONYM.has(w)) bad.push(['뜻이 다름', u.id, w, seen.get(w), k]);
      seen.set(w, k);
    }
  }
  assert.deepEqual(bad, []);
});
test('그림 문제: 한 레슨 안에서 그림이 겹치지 않는다', () => {
  const bad = [];
  for (const u of units) { if (u.noPic) continue; const e = (u.w || []).map(x => x[2]).filter(Boolean); if (new Set(e).size !== e.length) bad.push(u.id); }
  assert.deepEqual(bad, []);
});
test('문장: 영어와 뜻이 있고 같은 문장이 겹치지 않는다', () => {
  const seen = new Set(), bad = [];
  for (const u of units) for (const [en, ko] of u.s || []) { if (!EN.test(en) || !KO.test(ko)) bad.push(['형식', u.id, en]); if (seen.has(en)) bad.push(['중복', u.id, en]); seen.add(en); }
  assert.deepEqual(bad, []);
});
test('빈칸·대화·읽기: 정답이 오답과 겹치지 않는다', () => {
  const bad = [];
  for (const u of units) {
    for (const x of u.b || []) { if (!x[0].includes('___')) bad.push(['빈칸 없음', u.id, x[0]]); if (x[2].includes(x[1])) bad.push(['정답=오답', u.id, x[0]]); if (new Set(x[2]).size !== x[2].length) bad.push(['오답 중복', u.id, x[0]]); }
    for (const x of u.talk || []) { if (x[2].includes(x[1])) bad.push(['정답=오답', u.id, x[0]]); if (!KO.test(x[3])) bad.push(['뜻 없음', u.id, x[0]]); }
    for (const x of u.r || []) { if (x.o.includes(x.a)) bad.push(['정답=오답', u.id, x.q]); if (!KO.test(x.k)) bad.push(['뜻 없음', u.id, x.q]); }
  }
  assert.deepEqual(bad, []);
});
test('회화: 상황마다 대화 6개, 정답이 오답과 겹치지 않고 같은 질문이 반복되지 않는다', () => {
  const bad = [], seen = new Map();
  for (const u of units) {
    if (!u.d) continue;
    if (u.d.length !== (ENG[u.si].adult ? 3 : 6)) bad.push(['개수', u.id]);   // 어른 영어는 대화 3개 + 다른 문제 유형
    for (const x of u.d) {
      if (!EN.test(x[0] + x[2] + x[4].join('')) || !KO.test(x[1]) || !KO.test(x[3])) bad.push(['형식', u.id, x[0]]);
      if (x[4].includes(x[2]) || x[4][0] === x[4][1]) bad.push(['보기', u.id, x[0]]);
      const k = x[0] + '|' + x[2];
      if (seen.has(k)) bad.push(['중복', u.id, seen.get(k), x[0]]);
      seen.set(k, u.id);
    }
  }
  assert.deepEqual(bad, []);
});
test('영어 문장은 대문자로 시작하고 문장 부호로 끝난다', () => {
  const bad = [];
  const sen = (u, t) => { if (!/^[A-Z"]/.test(t) || !/[.!?"]$/.test(t)) bad.push([u.id, t]); };
  for (const u of units) { for (const x of u.s || []) sen(u, x[0]); for (const x of u.d || []) { sen(u, x[0]); sen(u, x[2]); } }
  assert.deepEqual(bad, []);
});
test('난이도: 위 단계로 갈수록 문장이 짧아지지 않는다', () => {
  const avg = si => { const list = ENG[si].units.flatMap(u => (u.s || []).map(x => x[0].split(' ').length)); return list.length ? list.reduce((p, c) => p + c, 0) / list.length : 0; };
  const v = [1, 2, 3].map(avg);
  assert.ok(v[0] <= v[1] + .3 && v[1] <= v[2] + .3, JSON.stringify(v));
});
test('학습 영역이 모두 있다', () => {
  const ids = new Set(units.map(u => u.id));
  for (const k of ['abc1', 'ph_rhyme', 'ph_vowel', 'color', 'number', 'animal', 'food', 'hello', 'c_day', 'c_exam']) assert.ok(ids.has(k), k);
});
test('영어 게임에 쓰는 단어 묶음이 충분하다', () => {
  for (const id of ['animal', 'food', 'color', 'number', 'transport', 'home']) {
    const u = units.find(x => x.id === id), pics = (u.w || []).map(w => w[2]).filter(Boolean);
    assert.ok(pics.length >= 6, id);
    assert.equal(new Set(pics).size, pics.length, id + ' 그림 중복');
  }
  const abc = units.filter(u => u.abc).flatMap(u => u.w.map(w => w[3]));
  assert.equal(abc.sort().join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
});
test('자연스럽지 않은 알파벳 문장을 쓰지 않는다', () => assert.ok(!html.includes('X is in box')));
test('문장 기차: 문장과 뜻이 있고 첫 글자와 문장 부호가 맞으며 겹치지 않는다', () => {
  const m = html.slice(html.indexOf('const EG_TRAIN = {'), html.indexOf('function egTrain'));
  const c2 = {}; vm.createContext(c2); vm.runInContext(m + ';this.T = EG_TRAIN;', c2);
  const all = [...c2.T.easy, ...c2.T.normal];
  assert.ok(c2.T.easy.length >= 5 && c2.T.normal.length >= 5);
  assert.equal(new Set(all.map(x => x[0])).size, all.length);
  for (const [en, ko] of all) { assert.ok(/^[A-Z][^.?!]*[.?!]$/.test(en), en); assert.ok(KO.test(ko), en); }
  for (const x of c2.T.easy) assert.ok(x[0].split(' ').length <= 4, x[0]);
  for (const x of c2.T.normal) assert.ok(x[0].split(' ').length >= 5 && x[0].split(' ').length <= 6, x[0]);
  for (const t of ['I like apples.', 'The cat is sleeping.', 'I want a red balloon.', 'Can I have some milk?']) assert.ok(all.some(x => x[0] === t), t);
});
function chunk(startMark, endMark, expose) { const m = html.slice(html.indexOf(startMark), html.indexOf(endMark, html.indexOf(startMark))); const c3 = {}; vm.createContext(c3); vm.runInContext(m + `;this.X = ${expose};`, c3); return c3.X; }
test('이야기 극장: 모든 장면에 갈 수 있고 끝이 있으며, 영어와 뜻이 있고 복습 단어가 실제로 있다', () => {
  const S = chunk('const STORIES = {', 'function egStory', 'STORIES');
  const words = new Set(units.flatMap(u => (u.w || []).map(w => w[0])));
  assert.equal(Object.keys(S).length, 3);
  for (const [id, st] of Object.entries(S)) {
    const seen = new Set(), walk = k => { if (seen.has(k)) return; seen.add(k); const sc = st.scenes[k]; assert.ok(sc, id + ':' + k); sc.c.forEach(c => walk(c[2])); };
    walk(st.start);
    assert.deepEqual([...seen].sort(), Object.keys(st.scenes).sort(), id + ' 도달 못 하는 장면');
    assert.ok(Object.values(st.scenes).some(sc => !sc.c.length), id + ' 끝');
    assert.ok(Object.values(st.scenes).some(sc => sc.c.length > 1), id + ' 갈림길');
    for (const sc of Object.values(st.scenes)) { assert.ok(/^[A-Z]/.test(sc.en) && /[.!?"]$/.test(sc.en) && EN.test(sc.en), sc.en); assert.ok(KO.test(sc.k), sc.en); for (const c of sc.c) { assert.ok(EN.test(c[0]) && KO.test(c[1]), c[0]); } }
    for (const w of st.review) assert.ok(words.has(w), id + ' ' + w);
  }
});
test('펫 카페: 주문 문장의 관사와 복수형이 맞다', () => {
  const m = html.slice(html.indexOf('const CAFE_MENU = ['), html.indexOf('function egCafe'));
  const c4 = {}; vm.createContext(c4); vm.runInContext(m + ';this.M = CAFE_MENU; this.O = cafeOrder;', c4);
  const order = (w, n) => c4.O(c4.M.find(x => x.w === w), n).en;
  assert.equal(order('apple', 1), 'Can I have an apple, please?');
  assert.equal(order('cookie', 2), 'Can I have two cookies, please?');
  assert.equal(order('sandwich', 3), 'Can I have three sandwiches, please?');
  assert.equal(order('milk', 0), 'Can I have some milk, please?');
  assert.ok(c4.O(c4.M[0], 2).ko.includes('2개'));
});
test('방향 단어와 정글 문장에 필요한 단어가 레슨에 있다', () => {
  const words = new Set(units.flatMap(u => (u.w || []).map(w => w[0])));
  for (const w of ['left', 'right', 'up', 'down', 'behind', 'next to', 'on']) assert.ok(words.has(w), w);
});
test('이야기 모험: 8장 구성과 대사, 답, 단어 연결이 맞다', () => {
  const m = html.slice(html.indexOf('const SAGA_WHO = {'), html.indexOf('const SAGA_TREE'));
  const c5 = {}; vm.createContext(c5);
  for (const f of ['egAlphabet', 'egCatch', 'egCafe', 'egJungle', 'egTrain', 'egSpeak']) c5[f] = () => {};
  vm.runInContext(m + ';this.W = SAGA_WHO; this.S = SAGA;', c5);
  assert.equal(c5.S.length, 8);
  const ids = new Set(units.map(u => u.id)), seen = new Set();
  for (const ch of c5.S) {
    assert.ok(KO.test(ch.t), ch.t);
    if (ch.words) assert.ok(ids.has(ch.words), ch.words);
    for (const [who, en, ko] of [...ch.before, ...ch.after]) {
      assert.ok(c5.W[who], who);
      assert.ok(EN.test(en) && /^[A-Z]/.test(en) && /[.!?]$/.test(en), en);
      assert.ok(KO.test(ko), en);
      assert.ok(!seen.has(en), '겹치는 대사: ' + en); seen.add(en);
    }
    assert.ok(KO.test(ch.ask.k) && KO.test(ch.ask.ak), ch.t);
    assert.ok(!ch.ask.o.includes(ch.ask.a) && ch.ask.o.length >= 2, ch.t);
    assert.ok(EN.test(ch.ask.q) && /\?$/.test(ch.ask.q), ch.ask.q);
  }
  assert.ok(c5.S.filter(x => x.gift).length >= 3);
});
// 게임과 이야기까지 모은 영어 문장 전체
function allEnglish() {
  const out = [];
  for (const u of units) {
    for (const x of u.s || []) out.push(x[0]);
    for (const x of u.b || []) { out.push(x[0].replace('___', x[1])); }
    for (const x of u.talk || []) out.push(x[0], x[1]);
    for (const x of u.r || []) out.push(x.p, x.q);
    for (const x of u.d || []) out.push(x[0], x[2], ...x[4]);
  }
  const train = chunk('const EG_TRAIN = {', 'function egTrain', 'EG_TRAIN'); out.push(...train.easy.map(x => x[0]), ...train.normal.map(x => x[0]));
  for (const st of Object.values(chunk('const STORIES = {', 'function egStory', 'STORIES'))) for (const sc of Object.values(st.scenes)) { out.push(sc.en); sc.c.forEach(c => out.push(c[0])); }
  return out;
}
test('레슨마다 카테고리, 나이, 목표가 있고 지시서의 20개 카테고리가 모두 있다', () => {
  const m = chunk('const ENG_META = {', 'const engMeta', 'ENG_META');
  const need = ['Alphabet & Phonics', 'Animals', 'Colors', 'Numbers', 'Food', 'Family', 'Body', 'School', 'Toys', 'Clothes', 'Weather', 'Nature', 'Transportation', 'Home', 'Feelings', 'Daily Routines', 'Greetings', 'Places', 'Action Words', 'Simple Sentences'];
  for (const u of units) { assert.ok(m[u.id], '정보 없음: ' + u.id); assert.ok(need.includes(m[u.id][0]), u.id); assert.ok(m[u.id][1] && KO.test(m[u.id][2]), u.id); }
  const have = new Set(Object.values(m).map(x => x[0]));
  for (const c of need) assert.ok(have.has(c), '카테고리 없음: ' + c);
  for (const k of Object.keys(m)) assert.ok(units.some(u => u.id === k), '없는 레슨: ' + k);
});
test('알파벳: 대표 단어가 그 글자로 시작한다 (X는 예외로 따로 표시)', () => {
  for (const u of units.filter(x => x.abc)) for (const [w, , , l] of u.w) { if (l === 'X') assert.ok(w.includes('x')); else assert.equal(w[0].toUpperCase(), l, w); }
  assert.ok(html.includes("inWord: x.l === 'X'") && html.includes("이 글자가 들어 있는 그림은?"));
  assert.ok(html.includes("mode = isX ? 'case'"), 'X는 첫소리 문제를 내지 않는다');
});
test('영어 문장 기계 검사: a/an, 대문자 I, 띄어쓰기, 미국식 표기', () => {
  const uk = /\b(colour|favourite|centre|grey|neighbour|metre|autumn|holiday|football|biscuit|mum|lorry|rubbish|flat)\b/i;
  const exceptAn = /\ban (hour|honest)\b/i, bad = [];
  for (const t of allEnglish()) {
    if (/\ba [aeiou]/i.test(t) && !/\ba (uni|one|use)/i.test(t)) bad.push(['a→an', t]);
    if (/\ban [^aeiou\s]/i.test(t) && !exceptAn.test(t)) bad.push(['an→a', t]);
    if (/(^|[ "])i( |'|\b[.,!?])/.test(t)) bad.push(['소문자 i', t]);
    if (/ {2}| [.,!?]|\.\.[^.]/.test(t)) bad.push(['띄어쓰기', t]);
    if (uk.test(t)) bad.push(['영국식', t]);
    if (/\b(\w+) \1\b/i.test(t) && !/\b(that that|had had|bye bye|choo choo)\b/i.test(t)) bad.push(['같은 단어 반복', t]);
  }
  assert.deepEqual(bad, []);
});
test('그림 검사: 뜻과 맞지 않는 것으로 확인한 그림을 다시 쓰지 않는다', () => {
  const words = units.flatMap(u => u.w || []);
  assert.ok(!words.some(w => w[0] === 'jump' && w[2]));
  assert.equal(words.find(w => w[0] === 'scared')[1], '무서워하는');
});
test('새 레슨과 보기: 같은 뜻의 단어가 한 레슨에 겹쳐 답이 둘이 되지 않는다', () => {
  for (const u of units) { const ks = (u.w || []).map(w => w[1]); assert.equal(new Set(ks).size, ks.length, u.id); }
});

test('어른 영어: 레슨마다 표현·문장·빈칸·대화·읽기가 모두 있다', () => {
  const st = ENG.find(g => g.adult);
  assert.ok(st && st.free && st === ENG[ENG.length - 1], '맨 뒤에 붙여 기존 진도가 잠기지 않는다');
  assert.ok(st.units.length >= 14);
  for (const u of st.units) {
    assert.ok(u.w.length >= 6 && u.s.length === 4 && u.b.length === 3 && u.d.length === 3 && u.r.length === 1, u.id);
    for (const b of u.b) { assert.ok(b[0].includes('___') && !b[2].includes(b[1]) && KO.test(b[3]), u.id + ' ' + b[0]); }
    for (const r of u.r) assert.ok(!r.o.includes(r.a) && KO.test(r.k), u.id);
  }
});
