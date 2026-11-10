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
vm.runInContext(`${lineOf('escapeHTML')}\n${lineOf('cleanName')}\n${section}\nthis.saveGuard = saveGuard; this.migrateSave = migrateSave; this.SAVE_VERSION = SAVE_VERSION; this.cleanName = cleanName; this.escapeHTML = escapeHTML;`, ctx);
const { saveGuard, cleanName, escapeHTML, migrateSave, SAVE_VERSION } = ctx;

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
    farm: { plots: [null, { crop: 'carrot', stage: 1, wet: true, start: 1000 }], pantry: { carrot: 2 }, harvested: 1, cooked: 0 }, missions: { day: 'ongoing', list: [{ id: 'feed', prog: 0, claimed: false }] },
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
  '보호자 값 위조': save({ parent: { limit: 'none' } }),
  '텃밭 단계 위조': save({ farm: { plots: [{ crop: 'carrot', stage: 99 }], pantry: {}, harvested: 0, cooked: 0 } }),
  '텃밭 시간이 글자': save({ farm: { plots: [{ crop: 'carrot', start: 'x' }], pantry: {}, harvested: 0, cooked: 0 } }),
  '가구 위치가 글자': save({ decor: { owned: ['teddy'], placed: { teddy: { x: 'a', z: 1, r: 0 } } } }),
  '친구 점수 위조': save({ friends: { somsom: { pts: -1 } } }),
  '배지에 객체': save({ badges: { eng3: { a: 1 } } }),
  '일일 기록 위조': save({ daily: { pat: 'x' } }),
  '목표 값 위조': save({ eng: { goals: { l1: 9 } } }),
  '더 새로운 버전': save({ sv: 999 })
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
  assert.ok(/connect-src 'self' blob:;/.test(html), '외부 서버 연결은 막고, 3D 모델 안의 그림(기기 메모리의 blob)만 허용');
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
test('마이그레이션: 옛 저장을 지금 버전으로 올리고 입력은 바꾸지 않는다', () => {
  const old = { v: 1, coins: 3, pets: [pet()], chatOK: true, eng: { level: 2, chatNick: 7 } }, before = JSON.stringify(old);
  const m = migrateSave(old);
  assert.equal(JSON.stringify(old), before);
  assert.equal(m.sv, SAVE_VERSION);
  assert.equal(m.chatOK, undefined);
  assert.equal(m.eng.chatNick, undefined);
  assert.equal(m.eng.level, 2);
});
test('지금 버전의 저장에 없앤 값이 있으면 거부한다', () => assert.ok(strict(save({ sv: SAVE_VERSION, chatOK: true })).err));
test('더 새로운 버전의 기기 저장은 멈추지 않고 읽는다', () => {
  const r = fix(save({ sv: 999 }));
  assert.equal(r.err, undefined);
  assert.equal(r.data.sv, SAVE_VERSION);
});
test('변조된 중첩 값: 고쳐서 읽는다', () => {
  const r = fix(save({ farm: { plots: [{ crop: 'carrot', stage: 99, wet: 'x', start: 'y', evil: 1 }], pantry: { carrot: -3 }, harvested: 'a', cooked: 0 }, decor: { owned: ['teddy'], placed: { teddy: { x: 'a', z: 5000, r: 0, evil: 1 } } }, friends: { somsom: { pts: 'x', met: 1, evil: 2 } }, badges: { a: { b: 1 } } }));
  assert.equal(r.err, undefined);
  const pl = r.data.farm.plots[0];
  assert.equal(pl.stage, 3); assert.equal(pl.start, 0); assert.equal(pl.wet, undefined); assert.equal(pl.evil, undefined);
  assert.deepEqual(plain(r.data.decor.placed.teddy), { x: 0, z: 1000, r: 0 });
  assert.equal(r.data.friends.somsom.pts, undefined); assert.equal(r.data.friends.somsom.evil, undefined);
  assert.equal(r.data.badges.a, undefined);
});
test('개인정보처리방침: 한국어와 영어의 구조가 같다', () => {
  const pv = fs.readFileSync(path.join(root, 'www', 'privacy.html'), 'utf8');
  const part = id => pv.slice(pv.indexOf(`<section id="${id}"`), pv.indexOf('</section>', pv.indexOf(`<section id="${id}"`)));
  const ko = part('ko'), en = part('en');
  const shape = x => x.split('<h2>').slice(1).map(sec => (sec.match(/<p>/g) || []).length);
  assert.equal(shape(ko).length, 6);
  assert.deepEqual(shape(ko), shape(en));
  assert.ok(ko.includes('말랑 영어 펫하우스') && en.includes('Malang English Pet House'));
  // 시행일이 양쪽 언어에서 같은 날짜여야 한다
  const kd = ko.match(/시행일: (\d{4})년 (\d{1,2})월 (\d{1,2})일/), ed = en.match(/Effective: ([A-Z][a-z]+) (\d{1,2}), (\d{4})/);
  assert.ok(kd && ed, '시행일 표기');
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  assert.deepEqual([+kd[1], +kd[2], +kd[3]], [+ed[3], MON.indexOf(ed[1]) + 1, +ed[2]]);
  assert.ok(!pv.includes('<h1>말랑 펫하우스'));
});
test('서비스 워커: 미리 받는 파일이 모두 있다', () => {
  const sw = fs.readFileSync(path.join(root, 'www', 'sw.js'), 'utf8');
  // 필수(CORE)와 선택(OPTIONAL) 목록을 모두 읽어 실제 파일이 있는지 본다
  const listOf = name => { const m = sw.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\]`)); assert.ok(m, name + ' 목록'); return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]); };
  const core = listOf('CORE'), optional = listOf('OPTIONAL');
  assert.ok(core.includes('index.html') && core.includes('vendor/three.min.js') && core.includes('privacy.html'));
  assert.ok(optional.includes('models/malang_bear.glb') && optional.includes('models/malang_plaza.glb'));
  for (const f of [...core, ...optional]) if (f !== './') assert.ok(fs.existsSync(path.join(root, 'www', f)), f);
  assert.ok(sw.includes('c.addAll(CORE)') && sw.includes('OPTIONAL.map(f => c.add(f).catch('), '선택 파일이 없어도 설치는 계속');
});
test('서비스 워커(모의 실행): 인터넷이 끊기면 저장본을, 연결되면 새 화면을 준다', async () => {
  const handlers = {}, saved = new Map([['index.html', 'OLD']]);
  const cachesMock = { match: async k => saved.get(typeof k === 'string' ? k : k.url), open: async () => ({ put: async (k, v) => saved.set(k, v), addAll: async () => {} }), keys: async () => [], delete: async () => true };
  let online = false;
  const sandbox = { self: { addEventListener: (n, f) => { handlers[n] = f; }, location: { origin: 'https://a' } }, location: { origin: 'https://a' }, caches: cachesMock, URL, Response: { error: () => 'ERR' },
    fetch: async () => { if (!online) throw new Error('offline'); return { ok: true, clone: () => 'NEW', body: 'NEW' }; } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'www', 'sw.js'), 'utf8'), sandbox);
  const go = () => new Promise((res, rej) => handlers.fetch({ request: { method: 'GET', url: 'https://a/', mode: 'navigate' }, respondWith: p => p.then(res, rej) }));
  assert.equal(await go(), 'OLD');
  online = true;
  assert.equal((await go()).body, 'NEW');
  await new Promise(r => setTimeout(r, 5));
  assert.equal(saved.get('index.html'), 'NEW');
});
test('새 학습 기록: 정상 값은 통과하고 위조 값은 거부한다', () => {
  const good = save({ eng: { level: 3, days: 4, lastDay: 'Fri Nov 06 2026', week: { id: 2965, days: 2, got: false }, weeks: 1, stars: 30, reviews: 2, w: { apple: { b: 6, due: 1, m: 2 } } } });
  const r = strict(good); assert.equal(r.err, undefined);
  assert.equal(r.data.eng.week.days, 2); assert.equal(r.data.eng.w.apple.m, 2);
  for (const bad of [{ days: -1 }, { days: 'x' }, { week: { id: 1, days: 99 } }, { week: { id: 1, days: 1, evil: 1 } }, { stars: '<b>' }, { w: { apple: { b: 7 } } }, { w: { apple: { b: 1, m: -1 } } }]) assert.ok(strict(save({ eng: Object.assign({ level: 1 }, bad) })).err, JSON.stringify(bad));
});

test('새 그래픽 설정(gfxOld)은 참·거짓만 받는다', () => {
  assert.equal(strict(save({ gfxOld: true })).err, undefined);
  assert.equal(strict(save({ gfxOld: false })).err, undefined);
  assert.ok(strict(save({ gfxOld: 'yes' })).err);
});

// ---------- STEP 2: 보호자 PIN 복구 코드, 이름 칸, 백업 왕복 ----------
function pinBox() {
  const a = html.indexOf('const PIN_KEY'), b = html.indexOf('function openPinSetup');
  const store = new Map();
  const box = { crypto: globalThis.crypto, TextEncoder, Uint8Array, localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) } };
  vm.createContext(box);
  vm.runInContext(html.slice(a, b) + '\nthis.pinSave = pinSave; this.pinState = pinState; this.pinHash = pinHash; this.hasRecovery = hasRecovery; this.normRC = normRC; this.pinClear = pinClear;', box);
  return box;
}
test('보호자 PIN: 만들면 복구 코드를 주고, 복구 코드는 해시로만 저장한다', async () => {
  const b = pinBox();
  const rc = await b.pinSave('4826');
  assert.match(rc, /^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/, '헷갈리는 글자(0 O 1 I L) 없는 8자리');
  const st = b.pinState();
  assert.ok(b.hasRecovery(st));
  assert.ok(!JSON.stringify(st).includes(rc.replace('-', '')) && !JSON.stringify(st).includes('4826'), '원래 PIN과 복구 코드는 저장하지 않는다');
  assert.equal(await b.pinHash('4826', st.salt), st.hash);
  assert.equal(await b.pinHash(b.normRC(rc.toLowerCase().replace('-', ' ')), st.rsalt), st.rhash, '소문자·공백으로 써도 맞다');
  assert.notEqual(await b.pinHash(b.normRC('AAAA-AAAA'), st.rsalt), st.rhash);
});
test('PIN을 잊었을 때: 복구 코드가 있으면 곱셈으로는 지울 수 없다', () => {
  const f = html.slice(html.indexOf('  const forgot = () => {'), html.indexOf('  const pin = st => {'));
  const withCode = f.slice(0, f.indexOf('return;\n    }'));
  assert.ok(withCode.includes('hasRecovery(st0)') && withCode.includes('pinHash(normRC(inp.value), now.rsalt) === now.rhash'));
  assert.ok(!/a \* b/.test(withCode), '복구 코드 경로에는 곱셈 정답 확인이 없다');
  assert.ok(f.includes('lock(inp, opened + 600000)'), '예전 PIN은 10분 대기');
  assert.ok(withCode.includes('now.fails >= 5'), '복구 코드도 틀리면 잠긴다');
});
test('이름 칸: 전화번호·이메일·주소는 막고 보통 이름은 통과', () => {
  const box = {}; vm.createContext(box); vm.runInContext(lineOf('piiLike') + '\nthis.piiLike = piiLike;', box);
  for (const v of ['010-1234-5678', '01012345678', 'me@mail', 'www.site', 'abc.com', 'http://x', '123']) assert.equal(box.piiLike(v), true, v);
  for (const v of ['뽀삐', '구름2', '콩떡이7', 'Lulu', '말랑 베어', '12']) assert.equal(box.piiLike(v), false, v);
  assert.ok(html.includes("if (piiLike($('#nameInput').value)) return toast(PII_MSG);") && html.includes("if (piiLike(body.querySelector('#adoptName').value)) return toast(PII_MSG);"));
});
test('백업 코드 왕복: 만든 코드를 되살리면 같은 기록, 한 글자만 바뀌어도 거부', () => {
  const a = html.indexOf('const BACKUP_PREFIX'), b = html.indexOf('// 지금 저장을 따로 보관한 다음 바꾼다');
  const box = { TextEncoder, TextDecoder, btoa, atob, saveCatalog: () => cat };
  vm.createContext(box);
  vm.runInContext(`${lineOf('escapeHTML')}\n${lineOf('cleanName')}\n${section}\n${html.slice(a, b)}\nthis.readBackup = readBackup; this.toB64 = toB64; this.hashStr = hashStr;`, box);
  const d = save({ coins: 77, pets: [pet({ name: '구름이', level: 9 })] }), json = JSON.stringify(d);
  const code = 'MALANG1.' + box.toB64(json) + '.' + box.hashStr(json);
  const r = box.readBackup(code);
  assert.equal(r.err, undefined); assert.equal(r.data.coins, 77); assert.equal(r.data.pets[0].name, '구름이'); assert.equal(r.data.pets[0].level, 9);
  const mid = 'MALANG1.'.length + 10, broken = code.slice(0, mid) + (code[mid] === 'A' ? 'B' : 'A') + code.slice(mid + 1);
  assert.ok(box.readBackup(broken).err, '바뀐 코드');
  assert.ok(box.readBackup('HELLO').err, '다른 글자');
  assert.ok(box.readBackup(code.slice(0, code.length - 3)).err, '잘린 코드');
});
