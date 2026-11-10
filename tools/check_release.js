// 빌드 전에 실행하는 점검: 필수 파일, 문법, 3D 모델, 앱 설정. 문제가 있으면 실패(종료 코드 1)한다.
// 실행: node tools/check_release.js          (출시 전 최종 점검: --release 를 붙이면 연락처 자리표시도 실패로 본다)
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..'), www = path.join(root, 'www');
const release = process.argv.includes('--release');
const errors = [], warns = [];
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// 1) 서비스 워커 목록의 파일이 실제로 있는가
const sw = read('www/sw.js');
const listOf = name => { const m = sw.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\]`)); if (!m) { errors.push(`sw.js에 ${name} 목록이 없어요`); return []; } return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]); };
for (const f of listOf('CORE')) if (f !== './' && !fs.existsSync(path.join(www, f))) errors.push(`필수 파일이 없어요: www/${f}`);
for (const f of listOf('OPTIONAL')) if (!fs.existsSync(path.join(www, f))) warns.push(`선택 파일이 없어요(게임은 예전 그래픽으로 켜짐): www/${f}`);
try { new vm.Script(sw, { filename: 'sw.js' }); } catch (e) { errors.push('sw.js 문법 오류: ' + e.message); }

// 2) index.html 안의 스크립트 문법
const html = read('www/index.html');
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => { try { new vm.Script(m[1], { filename: `index.html 스크립트 ${i + 1}` }); } catch (e) { errors.push(`index.html 스크립트 ${i + 1} 문법 오류: ${e.message}`); } });
for (const src of [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1])) if (!/^https?:/.test(src) && !fs.existsSync(path.join(www, src))) errors.push(`스크립트 파일이 없어요: www/${src}`);

// 3) 3D 모델: glTF 2.0 바이너리인가
for (const f of ['models/malang_bear.glb', 'models/malang_plaza.glb']) {
  const p = path.join(www, f); if (!fs.existsSync(p)) continue;
  const b = fs.readFileSync(p);
  if (b.toString('ascii', 0, 4) !== 'glTF' || b.readUInt32LE(4) !== 2 || b.readUInt32LE(8) !== b.length) errors.push(`GLB 형식이 아니거나 잘렸어요: www/${f}`);
}

// 4) 앱 설정 파일
for (const f of ['www/manifest.webmanifest', 'capacitor.config.json', 'package.json']) { try { JSON.parse(read(f)); } catch (e) { errors.push(`${f} JSON 오류: ${e.message}`); } }
if (JSON.parse(read('capacitor.config.json')).webDir !== 'www') errors.push('capacitor.config.json의 webDir이 www가 아니에요');

// 5) 개인정보처리방침 연락처 (실제 주소는 운영자가 정한다)
if (read('www/privacy.html').includes('YOUR-EMAIL@example.com')) (release ? errors : warns).push('개인정보처리방침 문의 이메일이 자리표시예요: python tools/set_contact_email.py 실제주소');

for (const w of warns) console.log('⚠️  ' + w);
for (const e of errors) console.log('❌ ' + e);
if (errors.length) { console.log(`점검 실패: ${errors.length}건`); process.exit(1); }
console.log(`점검 통과 (경고 ${warns.length}건)`);
