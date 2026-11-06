// 영어 내용의 기계적 품질 검사. 번역과 발음의 정확성은 사람이 봐야 하므로 이 테스트로 "검수 완료"가 되지는 않는다.
// 실행: node --test tests/content.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
const a = html.indexOf('const ENG = ['), b = html.indexOf('/* ---------- 단계별 해금', a);
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
    if (u.d.length !== 6) bad.push(['개수', u.id]);
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
