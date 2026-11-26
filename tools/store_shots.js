// 구글 플레이용 휴대폰 스크린샷(1080x1920) 만들기: 화면 없는 크롬으로 실제 게임을 열어 장면별로 찍는다.
// 추가 설치 없음(크롬 + Node 22 이상의 내장 WebSocket). 결과: docs/store-screenshots/play_*.png
// 실행: node tools/store_shots.js   (크롬 위치가 다르면 CHROME=크롬경로)
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawn } = require('node:child_process');
const www = path.join(__dirname, '..', 'www'), out = path.join(__dirname, '..', 'docs', 'store-screenshots');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const chrome = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
if (!chrome) { console.log('크롬을 찾지 못했어요 (CHROME 환경변수로 지정)'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.join(www, rel);
  if (!file.startsWith(www) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});

// 보기 좋은 시험용 저장: 부화한 곰, 레벨 8, 코인, 새 소식 팝업 없음
const SAVE = { v: 1, coins: 320, sound: false, music: false, active: 0, newsSeen: '99',
  pets: [{ sp: 'bear', name: '몽글', level: 8, xp: 20, hunger: 92, fun: 88, clean: 95, energy: 90, hat: null, asleep: false, hatched: true, taps: 12 }],
  hats: [], rooms: ['mint'], room: 'mint', lastTick: Date.now() };

server.listen(0, '127.0.0.1', async () => {
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'malang-shots-'));
  const cp = spawn(chrome, ['--headless=new', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--mute-audio', `--user-data-dir=${dir}`, '--remote-debugging-port=0', 'about:blank'], { stdio: 'ignore' });
  let port = 0;
  for (let i = 0; i < 100 && !port; i++) { await sleep(150); try { port = +fs.readFileSync(path.join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) {} }
  const finish = code => { try { cp.kill(); } catch (e) {} server.close(); setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} process.exit(code); }, 500); };
  if (!port) { console.log('크롬 디버그 연결 실패'); return finish(1); }
  const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const wait = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
  const cdp = (method, params = {}) => new Promise(r => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const js = async expr => { const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result && r.result.result ? r.result.result.value : r; };
  const shot = async name => {
    const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('찍음', name);
  };
  try {
    await cdp('Page.enable'); await cdp('Runtime.enable');
    await cdp('Emulation.setDeviceMetricsOverride', { width: 432, height: 768, deviceScaleFactor: 2.5, mobile: true });   // 1080x1920
    // 게임 스크립트보다 먼저 저장을 넣는다 (새로고침하면 게임이 지금 상태를 저장해 덮어쓰므로)
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('malang-pet-house-v1', ${JSON.stringify(JSON.stringify(SAVE))}); } catch (e) {}` });
    await cdp('Page.navigate', { url }); await sleep(10000);
    const closeAll = `(() => { try { if (typeof closeSheet === 'function') closeSheet(); } catch (e) {} document.querySelectorAll('.sheet .x, [aria-label="닫기"]').forEach(b => { try { b.click(); } catch (e) {} }); return true; })()`;
    await js(closeAll); await sleep(1200);
    await shot('play_1_home');
    // 영어 배우기 화면
    await js(`(() => { const b = document.getElementById('engBar'); if (b && !b.hidden) b.click(); else if (typeof openEnglish === 'function') openEnglish(); return true; })()`); await sleep(2000);
    await shot('play_2_english');
    await js(closeAll); await sleep(1000);
    // 친구들(펫 도감)
    await js(`(() => { const b = document.querySelector('[data-act="dex"]'); if (b) b.click(); return !!b; })()`); await sleep(1800);
    await shot('play_3_friends');
    await js(closeAll); await sleep(1000);
    // 마을로 나가기
    await js(`(() => { const b = document.querySelector('#roomTabs [data-go="door"]'); if (b) b.click(); return !!b; })()`); await sleep(7000);
    await js(closeAll); await sleep(800);
    await shot('play_4_village');
    console.log('완료 →', out); finish(0);
  } catch (e) { console.log('실패', e && e.message); finish(1); }
});
