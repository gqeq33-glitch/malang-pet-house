// 브라우저 실행 시험(가벼운 스모크): 크롬을 화면 없이 켜서 게임 첫 화면이 실제로 뜨는지 확인한다.
// 휴대폰 크기(375x812)와 PC 크기(1280x800) 두 번. 추가 도구 설치 없이 크롬만 있으면 된다.
// (크롬이 이 서버에 접속하므로 크롬은 반드시 비동기로 실행한다. 동기로 기다리면 서버가 멈춰 서로 기다린다)
// 실행: node tools/smoke_test.js   (크롬 위치가 다르면 CHROME=크롬경로 로 지정)
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const run = (cmd, args) => new Promise((res, rej) => execFile(cmd, args, { encoding: 'utf8', timeout: 90000, maxBuffer: 64 * 1024 * 1024 }, (e, out) => e ? rej(e) : res(out)));
const www = process.env.SMOKE_WWW ? path.resolve(process.env.SMOKE_WWW) : path.join(__dirname, '..', 'www');   // 시험용으로 다른 폴더 지정 가능
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.txt': 'text/plain' };
const chrome = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find(p => fs.existsSync(p));
if (!chrome) { console.log('크롬을 찾지 못해 스모크 시험을 건너뛰어요 (CHROME 환경변수로 지정)'); process.exit(process.env.CI ? 1 : 0); }
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.join(www, rel);
  if (!file.startsWith(www) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
server.listen(0, '127.0.0.1', async () => {
  const url = `http://127.0.0.1:${server.address().port}/index.html`, fails = [];
  for (const [w, h] of [[375, 812], [1280, 800]]) {
    const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'malang-smoke-'));
    let dom = '';
    try {
      dom = await run(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--user-data-dir=${dir}`, `--window-size=${w},${h}`, '--virtual-time-budget=8000', '--dump-dom', url]);
    } catch (e) { fails.push(`${w}x${h}: 크롬 실행 실패 ${e.message}`); continue; }
    finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
    // 처음 실행이면 스크립트가 펫 고르기 화면에 이름을 채워 넣는다(실행돼야만 생김). 시작 실패 화면(#bootFail)은 없어야 한다
    // (덤프에는 스크립트 원문도 들어 있으므로 원문에 있는 글자가 아니라, 실행 후에 생기는 화면 요소로 판단한다)
    const ok = /id="pickName">[^<]+</.test(dom) && /id="pickBig">\s*<svg/.test(dom), crashed = dom.includes('id="bootFail"');
    console.log(`${w}x${h}: ${ok && !crashed ? '통과' : '실패'} (화면 ${dom.length}자)`);
    if (!ok || crashed) fails.push(`${w}x${h}: 첫 화면이 뜨지 않았어요`);
  }
  server.close();
  if (fails.length) { fails.forEach(f => console.log('❌ ' + f)); process.exit(1); }
});
