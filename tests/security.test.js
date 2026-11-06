// 저장 데이터 검사(saveGuard)와 이름 정리, 채팅 제거를 확인한다. 실행: node --test tests/
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'www', 'index.html'), 'utf8');
const section = html.slice(html.indexOf('/* SAVE-GUARD-START'), html.indexOf('/* SAVE-GUARD-END */'));
const lineOf = name => html.split('\n').find(l => l.startsWith(`const ${name} = `));
const ctx = {};
vm.createContext(ctx);
vm.runInContext(`${lineOf('escapeHTML')}\n${lineOf('cleanName')}\n${section}\nthis.saveGuard = saveGuard; this.cleanName = cleanName; this.escapeHTML = escapeHTML;`, ctx);
const { saveGuard, cleanName, escapeHTML } = ctx;

const table = (...ids) => Object.fromEntries(ids.map(i => [i, { name: i, slot: i === 'cape' ? 'back' : 'top' }]));
const cat = {
  SPECIES: table('cat', 'puppy'), HATS: table('ribbon'), DYES: table('base', 'pink'), WEAR: table('cape', 'stripe'), RIDES: table('bike'),
  ROOMS: table('mint', 'beach'), DECOR: table('teddy'), FRIENDS: table('somsom'), CROPS: table('carrot'), MISSIONS: table('feed'),
  titles: ['newbie'], palMax: 8, notes: 12, cleanName, engStages: 5, engWords: new Set(["What's up?", 'apple']), engUnits: new Set(['abc1']),
  normPal: d => (d && d.s === 'cat' && typeof d.id === 'string' ? { id: d.id, n: cleanName(d.n, 'x'), s: d.s } : null)
};
const pet = (o = {}) => Object.assign({ sp: 'cat', name: '나비', level: 3, xp: 10, hunger: 70, fun: 60, clean: 50, energy: 40, hat: null, asleep: false, hatched: true, taps: 3 }, o);
const save = (o = {}) => Object.assign({ v: 1, coins: 30, sound: true, active: 0, pets: [pet()], hats: [], rooms: ['mint'], room: 'mint', lastTick: 1000 }, o);
const strict = d => saveGuard(d, cat, { now: 5000 });
const fix = d => saveGuard(d, cat, { repair: true, now: 5000 });
const plain = v => JSON.parse(JSON.stringify(v));

test('정상 백업: 값이 그대로 유지된다', () => {
  const d = save({
    best: { obby: 12.5 }, story: { i: 2, prog: 1, doneSeen: true }, parent: { limit: 60, breakEvery: 30, bedtime: true }, play: { day: 'Thu Nov 05 2026', sec: 10, extra: 0, nightOk: '' },
    farm: { plots: [null, { crop: 'carrot', stage: 1, wet: true }], pantry: { carrot: 2 }, harvested: 1, cooked: 0 }, missions: { day: 'ongoing', list: [{ id: 'feed', prog: 0, claimed: false }] },
    decor: { owned: ['teddy'], placed: { teddy: { x: 1, z: 2, r: 0 } } }, friends: { somsom: { pts: 3, met: true, day: '', q: 'none' } }, badges: { eng3: 'Thu Nov 05 2026' }, rewardClaims: { palAdd: 1 },
    stickers: { found: [1, 2], gifts: 0 }, pass: { pts: 10, got: 1 }, season: { id: 'halloween', year: 2026, candy: 1, found: [0] }, pals: [{ id: 'abc', n: '친구', s: 'cat' }], palId: 'abc123', palNote: 2,
    eng: { stage: 1, viewStage: 0, xp: 10, level: 2, units: { abc1: { stars: 3 } }, w: { "What's up?": { b: 1, due: 1000 } }, right: 3, wrong: 1, gifts: 1, slow: false, goals: { l1: 1 }, grad: { date: '2026. 11. 5.', score: 90 }, chatN: 1 }
  });
  const r = strict(d);
  assert.equal(r.err, undefined);
  const out = plain(r.data);
  assert.deepEqual(out.pets, plain(d.pets));
  assert.deepEqual(out.eng, plain(d.eng));
  assert.deepEqual(out.farm, plain(d.farm));
  assert.equal(out.coins, 30);
});
test('옛 백업: 나중에 생긴 항목이 없어도 통과하고, 없앤 채팅 값은 지운다', () => {
  const r = strict({ v: 1, coins: 5, pets: [{ sp: 'cat', name: '콩' }], chatOK: true });
  assert.equal(r.err, undefined);
  assert.equal(r.data.chatOK, undefined);
  assert.equal(r.data.pets[0].level, 1);
  assert.deepEqual(plain(r.data.rooms), ['mint']);
});
test('목록에 없는 옛 아이템은 호환을 위해 빼고 통과한다', () => {
  const r = strict(save({ hats: ['ribbon', 'oldhat'], pets: [pet({ hat: 'oldhat' })], room: 'oldroom' }));
  assert.equal(r.err, undefined);
  assert.deepEqual(plain(r.data.hats), ['ribbon']);
  assert.equal(r.data.pets[0].hat, null);
  assert.equal(r.data.room, 'mint');
});
const rejects = {
  '버전이 다름': { v: 2, coins: 0, pets: [pet()] },
  '펫 없음': save({ pets: [] }),
  '펫 종류 위조': save({ pets: [pet({ sp: 'dragon' })] }),
  '펫 종류가 내장 이름': save({ pets: [pet({ sp: 'constructor' })] }),
  '펫이 너무 많음': save({ pets: Array.from({ length: 31 }, () => pet()) }),
  '코인 음수': save({ coins: -1 }),
  '코인 초과': save({ coins: 1e9 }),
  '코인이 글자': save({ coins: '<img src=x onerror=alert(1)>' }),
  '코인 없음': { v: 1, pets: [pet()] },
  '레벨 초과': save({ pets: [pet({ level: 99999 })] }),
  '레벨이 글자': save({ pets: [pet({ level: '9' })] }),
  '경험치 음수': save({ pets: [pet({ xp: -5 })] }),
  '상태 초과': save({ pets: [pet({ hunger: 101 })] }),
  '펫 속성 위조': save({ pets: [pet({ isAdmin: true })] }),
  '최상위 속성 위조': save({ hacked: 1 }),
  '위험한 키': JSON.parse('{"v":1,"coins":1,"pets":[{"sp":"cat","name":"a"}],"best":{"__proto__":{"x":1}}}'),
  '아이템 ID에 HTML': save({ hats: ['<img src=x>'] }),
  '아이템이 숫자': save({ hats: [1] }),
  '아이템 목록이 아님': save({ hats: 'ribbon' }),
  '방에 HTML': save({ room: '"><script>' }),
  '배열이 너무 김': save({ stickers: { found: Array(5000).fill(1), gifts: 0 } }),
  '글자가 너무 김': save({ newsSeen: 'x'.repeat(5000) }),
  '전체가 너무 큼': save({ badges: { a: 'x'.repeat(100), b: Array(40000).fill('x'.repeat(60)) } }),
  '문자열에 HTML': save({ newsSeen: '<b>x</b>' }),
  '너무 깊음': save({ daily: { a: { b: { c: { d: { e: { f: { g: { h: { i: 1 } } } } } } } } } }),
  '영어 레벨 위조': save({ eng: { level: -3 } }),
  '영어 속성 위조': save({ eng: { level: 1, evil: 1 } }),
  '친구 목록 위조': save({ pals: [{ id: 'a', n: 'x', s: 'dragon' }] }),
  '친구가 너무 많음': save({ pals: Array.from({ length: 9 }, (_, i) => ({ id: 'a' + i, n: 'x', s: 'cat' })) }),
  '보호자 값 위조': save({ parent: { limit: 'none' } })
};
for (const [name, d] of Object.entries(rejects)) test(`비정상 백업 거부: ${name}`, () => assert.ok(strict(d).err, '거부되어야 한다'));

test('이름의 XSS는 태그가 깨진 채 8글자로 줄어든다', () => {
  const r = strict(save({ pets: [pet({ name: '<img src=x onerror=alert(1)>' })] }));
  assert.equal(r.err, undefined);
  assert.ok(!/[<>]/.test(r.data.pets[0].name));
  assert.ok(r.data.pets[0].name.length <= 8);
  assert.equal(escapeHTML('<a b="c">&\''), '&lt;a b=&quot;c&quot;&gt;&amp;&#39;');
});
test('이름의 보이지 않는 글자를 뺀다', () => assert.equal(cleanName('a‮b​c', 'x'), 'abc'));

test('변조된 저장: 고쳐서 읽고 기록은 살린다', () => {
  const r = fix(save({ coins: 1e12, hacked: 1, hats: ['ribbon', '<x>'], room: '"><img>', pets: [pet({ level: 1e7, hunger: 900, name: '<b>나비</b>' }), pet({ sp: 'dragon' })], active: 9, eng: { level: 'x', xp: -1, evil: 1 }, newsSeen: '<script>' }));
  assert.equal(r.err, undefined);
  const d = r.data;
  assert.equal(d.coins, 100000000);
  assert.equal(d.hacked, undefined);
  assert.deepEqual(plain(d.hats), ['ribbon']);
  assert.equal(d.pets.length, 1);
  assert.equal(d.pets[0].level, 9999);
  assert.equal(d.pets[0].hunger, 100);
  assert.ok(!/[<>]/.test(d.pets[0].name));
  assert.equal(d.active, 0);
  assert.equal(d.eng.level, 1);
  assert.equal(d.eng.xp, 0);
  assert.equal(d.newsSeen, undefined);
  assert.ok(r.fixes.length > 0);
  assert.ok(!/[<>]/.test(JSON.stringify(d)));
});
test('펫이 아직 없는 새 저장은 그대로 읽는다', () => {
  const r = fix({ v: 1, coins: 30, pets: [], hats: [], rooms: ['mint'], room: 'mint', lastTick: 1 });
  assert.equal(r.err, undefined);
  assert.equal(r.fixes.length, 0);
});
test('저장 형식이 아니면 읽지 않는다', () => { for (const d of [null, [], 'x', { v: 1 }, { v: 3, pets: [] }]) assert.ok(fix(d).err); });
test('검사는 입력을 바꾸지 않는다', () => {
  const d = save({ hats: ['ribbon', 'oldhat'], chatOK: true }), before = JSON.stringify(d);
  strict(d); fix(d);
  assert.equal(JSON.stringify(d), before);
});

test('공개 버전에 채팅·PeerJS가 없다', () => {
  for (const w of ['PeerJS', 'peerjs', 'new window.Peer', 'openChat', 'chatCheck', 'RTCPeerConnection', 'WebSocket']) assert.ok(!html.includes(w), w);
  assert.ok(/connect-src 'self';/.test(html));
  assert.ok(!fs.existsSync(path.join(root, 'www', 'vendor', 'peerjs.min.js')));
  assert.ok(!fs.readFileSync(path.join(root, 'www', 'sw.js'), 'utf8').includes('peerjs'));
});
test('개인정보처리방침: 실제 메일을 지어내지 않았고 채팅이 없다고 양쪽 언어로 쓴다', () => {
  const pv = fs.readFileSync(path.join(root, 'www', 'privacy.html'), 'utf8');
  assert.equal(pv.match(/YOUR-EMAIL@example\.com/g).length, 2);
  assert.ok(pv.includes('온라인 채팅과 자유 입력 메시지가 없습니다') && pv.includes('no online chat'));
  assert.ok(!/PeerJS/.test(pv));
});
test('서비스 워커: 게임 화면은 네트워크 우선이고 옛 화면을 새로 연다', () => {
  const sw = fs.readFileSync(path.join(root, 'www', 'sw.js'), 'utf8');
  assert.ok(sw.includes("req.mode === 'navigate'"));
  assert.ok(sw.includes('c.navigate(c.url)'));
});
