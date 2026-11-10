/* 말랑 월드 에셋 제작기: 말랑 베어(귀여운 2판)와 마을 광장을 만들어 GLB·PNG로 저장한다.
   game 모드: 게임 렌더러(색 보정 없음)에 맞춘 색과 가벼운 폴리곤
   render 모드: 그림(PNG)용 고품질 */
const TAU = Math.PI * 2;
const INKP = '#2E2240';
function mixHex(a, b, k) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = s => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k); return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1); }
function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function sparkle4(g, x, y, r) { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x + r * .18, y - r * .18, x + r, y); g.quadraticCurveTo(x + r * .18, y + r * .18, x, y + r); g.quadraticCurveTo(x - r * .18, y + r * .18, x - r, y); g.quadraticCurveTo(x - r * .18, y - r * .18, x, y - r); g.fill(); }
// 얼굴 그림 (게임에서도 같은 함수로 표정을 바꾼다)
function drawEye(kind, iris) {
  return canvas(160, 200, (g, w, h) => {
    const cx = 80, cy = 104; g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'happy' || kind === 'closed' || kind === 'sleepy') {
      g.strokeStyle = INKP; g.lineWidth = 17; g.beginPath();
      if (kind === 'happy') { g.moveTo(30, 124); g.quadraticCurveTo(80, 44, 130, 124); } else if (kind === 'sleepy') { g.moveTo(28, 108); g.lineTo(132, 108); } else { g.moveTo(30, 100); g.quadraticCurveTo(80, 146, 130, 100); }
      g.stroke(); return;
    }
    if (kind === 'heart') { g.fillStyle = '#FF5C8A'; g.beginPath(); g.moveTo(80, 160); g.bezierCurveTo(10, 110, 20, 40, 80, 70); g.bezierCurveTo(140, 40, 150, 110, 80, 160); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(58, 78, 12, 9, -.6, 0, TAU); g.fill(); return; }
    const rx = kind === 'surprised' ? 54 : 60, ry = kind === 'surprised' ? 78 : 84;
    g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.clip();
    let gr = g.createLinearGradient(0, cy - ry, 0, cy + ry); gr.addColorStop(0, '#1B1330'); gr.addColorStop(1, '#3B2B55'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    gr = g.createRadialGradient(cx, cy + 46, 6, cx, cy + 22, 74); gr.addColorStop(0, mixHex(iris, '#FFFFFF', .6)); gr.addColorStop(.5, iris); gr.addColorStop(1, 'rgba(20,10,40,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy + 14, 54, 66, 0, 0, TAU); g.fill();
    if (kind === 'star') { g.fillStyle = '#FFD84D'; g.save(); g.translate(cx, cy + 6); g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); }
    else { g.fillStyle = '#120B1F'; g.beginPath(); g.ellipse(cx, cy + 6, kind === 'surprised' ? 16 : 28, kind === 'surprised' ? 20 : 38, 0, 0, TAU); g.fill(); }
    g.restore();
    if (kind === 'surprised') { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, rx - 3, ry - 3, 0, 0, TAU); g.stroke(); }
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(cx + 22, cy - 36, 22, 26, -.35, 0, TAU); g.fill();
    g.beginPath(); g.arc(cx - 24, cy + 38, 10, 0, TAU); g.fill(); g.globalAlpha = .9; sparkle4(g, cx - 26, cy - 44, 11); g.globalAlpha = 1;
    if (kind === 'sad') { g.fillStyle = '#9FDcff'; g.fillStyle = '#9FDCFF'; g.beginPath(); g.moveTo(40, 150); g.quadraticCurveTo(26, 176, 40, 190); g.quadraticCurveTo(54, 176, 40, 150); g.fill(); }
    g.strokeStyle = mixHex(iris, '#FFFFFF', .35); g.globalAlpha = .55; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, cy + 4, rx - 9, ry - 9, 0, .25 * Math.PI, .75 * Math.PI); g.stroke(); g.globalAlpha = 1;
  });
}
function drawMouth(kind) {
  return canvas(160, 120, (g) => {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INKP; g.lineWidth = 9;
    if (kind === 'w') { g.beginPath(); g.moveTo(38, 46); g.quadraticCurveTo(59, 78, 80, 46); g.quadraticCurveTo(101, 78, 122, 46); g.stroke(); }
    else if (kind === 'open') { g.beginPath(); g.moveTo(42, 34); g.lineTo(118, 34); g.quadraticCurveTo(118, 104, 80, 104); g.quadraticCurveTo(42, 104, 42, 34); g.closePath(); g.fillStyle = '#7A2E4A'; g.fill(); g.save(); g.clip(); g.fillStyle = '#FF8FA8'; g.beginPath(); g.ellipse(80, 104, 30, 22, 0, 0, TAU); g.fill(); g.restore(); g.stroke(); }
    else if (kind === 'o') { g.fillStyle = '#7A2E4A'; g.beginPath(); g.ellipse(80, 62, 17, 21, 0, 0, TAU); g.fill(); g.stroke(); }
    else if (kind === 'sad') { g.beginPath(); g.moveTo(52, 70); g.quadraticCurveTo(80, 42, 108, 70); g.stroke(); }
    else if (kind === 'flat') { g.beginPath(); g.moveTo(56, 58); g.lineTo(104, 54); g.stroke(); }
    else if (kind === 'sleep') { g.fillStyle = '#7A2E4A'; g.beginPath(); g.ellipse(80, 60, 9, 7, 0, 0, TAU); g.fill(); }
  });
}
function drawBlush() { return canvas(128, 96, (g) => { const r = g.createRadialGradient(64, 48, 0, 64, 48, 60); r.addColorStop(0, 'rgba(255,120,150,.8)'); r.addColorStop(1, 'rgba(255,120,150,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 96); g.fillStyle = 'rgba(255,255,255,.75)'; for (const [x, y] of [[48, 40], [60, 34], [72, 40]]) { g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); } }); }

const BEAR = { body: '#FFDFB8', coral: '#FF8E7C', cream: '#FFF7EC', foot: '#FFD3B0', iris: '#8A5536', nose: '#4A2E45', gold: '#FFD36E' };
// 하트: 위쪽이 둥근 두 봉우리, 아래가 뾰족 (지름 약 2*s)
function heartShape(s = 1) {
  const h = new THREE.Shape(), k = s / 9.5, P = (x, y) => [(x - 5) * k, (9.5 - y) * k];
  h.moveTo(...P(5, 5)); h.bezierCurveTo(...P(5, 5), ...P(4, 0), ...P(0, 0)); h.bezierCurveTo(...P(-6, 0), ...P(-6, 7), ...P(-6, 7));
  h.bezierCurveTo(...P(-6, 11), ...P(-3, 15.4), ...P(5, 19)); h.bezierCurveTo(...P(12, 15.4), ...P(16, 11), ...P(16, 7));
  h.bezierCurveTo(...P(16, 7), ...P(16, 0), ...P(10, 0)); h.bezierCurveTo(...P(7, 0), ...P(5, 5), ...P(5, 5)); return h;
}
function starShape(R = 1, r = .48) { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } return s; }

function makeKit(game) {
  const cache = {};
  const seg = game ? [24, 16] : [48, 32], segS = game ? [14, 10] : [28, 18];
  const G = { s: new THREE.SphereGeometry(1, seg[0], seg[1]), ss: new THREE.SphereGeometry(1, segS[0], segS[1]), c: new THREE.CylinderGeometry(1, 1, 1, game ? 16 : 32), cone: new THREE.ConeGeometry(1, 1, game ? 16 : 32) };
  const M = (color, o = {}) => {
    const k = color + JSON.stringify(o); if (cache[k]) return cache[k];
    const m = new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: .55, metalness: 0, clearcoat: .35, clearcoatRoughness: .45 }, o));
    if (!game) { m.color.convertSRGBToLinear(); if (o.emissive) m.emissive.convertSRGBToLinear(); }
    m.name = 'mat_' + color.slice(1);
    return (cache[k] = m);
  };
  const tex = c => { const t = new THREE.CanvasTexture(c); if (!game) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; };
  const mesh = (p, geo, mat, x, y, z, sx, sy = sx, sz = sx, name) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; if (name) m.name = name; p.add(m); return m; };
  const grp = (p, name, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.name = name || ''; g.position.set(x, y, z); p.add(g); return g; };
  const patch = (sph, mat, cx, cy, w, h, name, r = 1.012) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12, Math.PI / 2 + cx - w / 2, w, Math.PI / 2 - cy - h / 2, h), mat); m.name = name; m.renderOrder = 2; sph.add(m); return m; };
  const faceMat = (canvasEl, name, gloss = .6) => { const m = new THREE.MeshPhysicalMaterial({ map: tex(canvasEl), transparent: true, depthWrite: false, roughness: .3, clearcoat: gloss, clearcoatRoughness: .15, polygonOffset: true, polygonOffsetFactor: -2 }); m.name = name; return m; };
  return { G, M, tex, mesh, grp, patch, faceMat };
}

/* ---------- 말랑 베어 (귀여운 2판) ---------- */
function buildBear(game) {
  const K = makeKit(game), { G, M, mesh, grp, patch, faceMat } = K, C = BEAR;
  const root = new THREE.Group(); root.name = 'MB_root';
  const body = grp(root, 'MB_body');
  const mb = M(C.body), mc = M(C.coral), mcr = M(C.cream);
  mesh(body, G.s, mb, 0, .7, 0, .6, .6, .56, 'MB_torso');
  // 배의 하트 무늬
  const hg = new THREE.ExtrudeGeometry(heartShape(.19), { depth: .01, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2 });
  hg.center(); const hm = mesh(body, hg, mcr, 0, .64, .548, 1, 1, 1, 'MB_tummy'); hm.rotation.x = -.14;
  for (const sd of [-1, 1]) {
    const leg = grp(body, sd < 0 ? 'MB_legL' : 'MB_legR', sd * .27, .3, .02);
    mesh(leg, G.s, M(C.foot), 0, -.15, .07, .21, .16, .27);
    mesh(leg, G.ss, mc, 0, -.2, .32, .1, .075, .03);
    const arm = grp(body, sd < 0 ? 'MB_armL' : 'MB_armR', sd * .5, 1.0, .02);
    mesh(arm, G.s, mb, 0, -.2, 0, .16, .25, .17); mesh(arm, G.ss, M(C.foot), 0, -.38, .04, .13, .11, .13);
    mesh(arm, G.ss, mc, 0, -.42, .14, .06, .05, .02);
  }
  const head = grp(body, 'MB_head', 0, 1.74, 0);
  const H = mesh(head, G.s, mb, 0, 0, 0, .84 * 1.1, .84 * .97, .84 * 1.02, 'MB_skull');
  const eyeL = faceMat(drawEye('open', C.iris), 'MB_eyeL_mat', 1), eyeR = faceMat(drawEye('open', C.iris), 'MB_eyeR_mat', 1);
  patch(H, eyeL, -.37, -.1, .5, .64, 'MB_eyeL'); patch(H, eyeR, .37, -.1, .5, .64, 'MB_eyeR');
  const blush = faceMat(drawBlush(), 'MB_blush_mat', 0); patch(H, blush, -.7, -.38, .46, .32, 'MB_blushL'); patch(H, blush, .7, -.38, .46, .32, 'MB_blushR');
  const mz = mesh(head, G.s, mcr, 0, -.36, .63, .3, .21, .21, 'MB_muzzle');
  const mouth = faceMat(drawMouth('w'), 'MB_mouth_mat', .2); patch(mz, mouth, 0, -.4, 1, .8, 'MB_mouth', 1.02);
  const ng = new THREE.ExtrudeGeometry(heartShape(.085), { depth: .03, bevelEnabled: true, bevelThickness: .03, bevelSize: .025, bevelSegments: 3 });
  ng.center(); const nose = mesh(head, ng, M(C.nose, { clearcoat: 1, roughness: .2 }), 0, -.24, .82, 1, 1, 1, 'MB_nose'); nose.rotation.x = -.25;
  for (const sd of [-1, 1]) {
    const e = grp(head, sd < 0 ? 'MB_earL' : 'MB_earR', sd * .6, .58, -.06);
    mesh(e, G.s, mb, 0, 0, 0, .3, .3, .18); mesh(e, G.ss, mc, 0, -.01, .12, .19, .19, .08);
  }
  // 정수리의 말린 털 한 가닥
  const curl = mesh(head, new THREE.TorusGeometry(.12, .05, game ? 8 : 14, game ? 16 : 28, Math.PI * 1.5), mb, .02, .9, .12, 1, 1, 1, 'MB_curl'); curl.rotation.set(0, Math.PI / 2, .6);
  mesh(head, G.ss, mb, -.02, .82, .06, .09, .12, .09);
  // 책가방과 별 핀
  const bag = grp(body, 'MB_bag', 0, .9, -.46);
  mesh(bag, G.s, mc, 0, 0, 0, .42, .44, .23); mesh(bag, G.s, M('#FF7464'), 0, .16, .12, .36, .19, .15);
  const sg = new THREE.ExtrudeGeometry(starShape(), { depth: .3, bevelEnabled: true, bevelThickness: .12, bevelSize: .1, bevelSegments: 2 }); sg.center();
  const gold = M(C.gold, { metalness: .35, roughness: .25, emissive: '#7A5200', emissiveIntensity: .25 });
  mesh(bag, sg, gold, 0, .05, .25, .09, .09, .09, 'MB_bagStar');
  for (const sd of [-1, 1]) { const st = mesh(body, new THREE.TorusGeometry(.42, .045, 8, game ? 18 : 28, Math.PI * .9), mc, sd * .3, .93, 0, 1, 1, 1); st.rotation.set(0, Math.PI / 2, Math.PI * .55); }
  const pin = mesh(body, sg, gold, .24, 1.03, .49, .1, .1, .1, 'MB_pin'); pin.rotation.y = -.25;
  const tail = grp(body, 'MB_tail', 0, .52, -.5); mesh(tail, G.s, mcr, 0, 0, 0, .15, .15, .15);
  root.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
  const parts = n => root.getObjectByName(n);
  return { root, faces: { eyeL, eyeR, mouth }, kit: K, n: { body, head, armL: parts('MB_armL'), armR: parts('MB_armR'), legL: parts('MB_legL'), legR: parts('MB_legR'), earL: parts('MB_earL'), earR: parts('MB_earR'), tail } };
}
// 동작별 자세 (게임에서도 같은 값). t는 초
const CLIPS = { idle: 2.4, walk: 1, run: .6, jump: 1.5, wave: 1.6, dance: 2, happy: 1.2, sad: 2, surprised: 1.4, sleep: 3 };
function poseAt(name, t) {
  const P = { y: 0, rx: 0, ry: 0, rz: 0, sy: 1, aL: [0, 0, -.16], aR: [0, 0, .16], lL: 0, lR: 0, h: [0, 0, 0], ear: 0, tail: 0, eye: 'open', mouth: 'w' };
  const L = CLIPS[name], k = t / L * TAU;
  if (name === 'idle') { P.h = [0, Math.sin(k) * .28, Math.sin(k * 2) * .05]; P.sy = 1 + Math.sin(k * 2) * .02; P.aL[2] = -.16 - Math.sin(k * 2) * .04; P.aR[2] = .16 + Math.sin(k * 2) * .04; P.ear = Math.sin(k * 3) * .08; P.tail = Math.sin(k * 2) * .3; }
  else if (name === 'walk' || name === 'run') { const run = name === 'run', s = Math.sin(k); P.lL = s * (run ? .9 : .6); P.lR = -P.lL; P.aL = [-P.lL * .8, 0, -.25]; P.aR = [P.lL * .8, 0, .25]; P.y = Math.abs(Math.cos(k)) * (run ? .2 : .08); P.rz = s * .04; P.rx = run ? .16 : .04; P.ear = s * .1; P.tail = s * .4; if (run) P.mouth = 'open'; }
  else if (name === 'jump') { const q = t / L, h = q < .18 ? 0 : q < .78 ? Math.sin((q - .18) / .6 * Math.PI) : 0; P.y = h * 1.3; P.sy = q < .18 ? 1 - .16 * Math.sin(q / .18 * Math.PI) : q > .78 ? 1 - .12 * Math.sin((q - .78) / .22 * Math.PI) : 1 + .06 * h; P.aL[2] = -.3 - h * 2.1; P.aR[2] = .3 + h * 2.1; P.lL = -h * .5; P.lR = -h * .3; if (h > .3) { P.eye = 'happy'; P.mouth = 'open'; } }
  else if (name === 'wave') { P.aR = [0, 0, 2.3 + Math.sin(k * 3) * .35]; P.h = [0, .15, Math.sin(k) * .08]; P.mouth = 'open'; P.eye = 'happy'; }
  else if (name === 'dance') { const s = Math.sin(k * 2); P.y = Math.abs(s) * .16; P.rz = Math.sin(k) * .16; P.ry = Math.sin(k) * .9; P.aL[2] = -1.5 + s * .6; P.aR[2] = 1.5 + s * .6; P.lL = Math.max(0, s) * .5; P.lR = Math.max(0, -s) * .5; P.h[2] = s * .12; P.eye = 'happy'; P.mouth = 'open'; P.tail = s * .4; }
  else if (name === 'happy') { P.eye = 'happy'; P.mouth = 'open'; P.y = Math.abs(Math.sin(k)) * .26; P.aL[2] = -2.4 + Math.sin(k * 2) * .3; P.aR[2] = 2.4 - Math.sin(k * 2) * .3; P.h[2] = Math.sin(k) * .1; P.tail = Math.sin(k * 3) * .4; }
  else if (name === 'sad') { P.eye = 'sad'; P.mouth = 'sad'; P.h = [.22, 0, Math.sin(k) * .04]; P.aL = [.2, 0, -.05]; P.aR = [.2, 0, .05]; P.sy = .97; P.ear = -.25; }
  else if (name === 'surprised') { const q = t / L; P.eye = 'surprised'; P.mouth = 'o'; P.y = q < .25 ? Math.sin(q / .25 * Math.PI) * .35 : 0; P.aL = [-.5, 0, -1.3]; P.aR = [-.5, 0, 1.3]; P.h[0] = -.12; P.ear = .2; }
  else if (name === 'sleep') { P.eye = 'closed'; P.mouth = 'sleep'; P.h = [.2, 0, .28]; P.sy = 1 + Math.sin(k) * .045; P.lL = P.lR = -1.35; P.y = -.22; P.aL = [-.3, 0, -.1]; P.aR = [-.3, 0, .1]; }
  return P;
}
function applyPose(b, P) {
  const n = b.n;
  n.body.position.y = P.y; n.body.rotation.set(P.rx, P.ry, P.rz); n.body.scale.set(1, P.sy, 1);
  n.head.rotation.set(...P.h); n.armL.rotation.set(...P.aL); n.armR.rotation.set(...P.aR); n.legL.rotation.x = P.lL; n.legR.rotation.x = P.lR;
  n.earL.rotation.z = -.1 + P.ear; n.earR.rotation.z = .1 - P.ear; n.tail.rotation.y = P.tail;
}
function bakeClips(b) {
  const clips = [], FPS = 30, nodes = ['body', 'head', 'armL', 'armR', 'legL', 'legR', 'earL', 'earR', 'tail'];
  for (const [name, len] of Object.entries(CLIPS)) {
    const N = Math.round(len * FPS) + 1, times = [], q = {}, pos = [], scl = [];
    nodes.forEach(k => { q[k] = []; });
    for (let i = 0; i < N; i++) {
      const t = i / FPS; times.push(t); applyPose(b, poseAt(name, Math.min(t, len - 1e-4)));
      nodes.forEach(k => q[k].push(...b.n[k].quaternion.toArray()));
      pos.push(...b.n.body.position.toArray()); scl.push(...b.n.body.scale.toArray());
    }
    const tracks = nodes.map(k => new THREE.QuaternionKeyframeTrack(b.n[k].name + '.quaternion', times, q[k]));
    tracks.push(new THREE.VectorKeyframeTrack('MB_body.position', times, pos), new THREE.VectorKeyframeTrack('MB_body.scale', times, scl));
    clips.push(new THREE.AnimationClip(name, len, tracks));
  }
  applyPose(b, poseAt('idle', 0));
  return clips;
}
function setFaceTex(b, eye, mouth) {
  const K = b.kit;
  b.faces.eyeL.map = K.tex(drawEye(eye, BEAR.iris)); b.faces.eyeR.map = K.tex(drawEye(eye, BEAR.iris)); b.faces.mouth.map = K.tex(drawMouth(mouth));
  b.faces.eyeL.needsUpdate = b.faces.eyeR.needsUpdate = b.faces.mouth.needsUpdate = true;
}

/* ---------- 마을 광장 소품 (분수대·꽃밭·가로등·벤치) ---------- */
// 길이 나가는 방향(라디안, 광장 중심 기준)을 피해 꽃밭과 가로등을 둔다
function buildPlaza(game, pathAngles = []) {
  const K = makeKit(game), { G, M, mesh, grp } = K;
  const root = new THREE.Group(); root.name = 'PZ_root';
  const f = grp(root, 'PZ_fountain');
  const stone = M('#FFF8F0', { roughness: .45 }), coral = M('#FF9E9E', { roughness: .4 });
  const water = M('#7FD8FF', { transparent: true, opacity: .85, roughness: .08, clearcoat: 1, emissive: '#3FB6E8', emissiveIntensity: .15 });
  mesh(f, G.c, stone, 0, .3, 0, 2.05, .6, 2.05, 'PZ_basin');
  const rim = mesh(f, new THREE.TorusGeometry(2.05, .18, 10, game ? 40 : 64), coral, 0, .6, 0, 1, 1, 1, 'PZ_rim'); rim.rotation.x = Math.PI / 2;
  mesh(f, G.c, water, 0, .58, 0, 1.92, .04, 1.92, 'PZ_water1');
  mesh(f, G.c, stone, 0, 1.25, 0, .32, 1.4, .32, 'PZ_column');
  mesh(f, G.c, stone, 0, 1.95, 0, 1.0, .22, 1.0, 'PZ_bowl');
  const rim2 = mesh(f, new THREE.TorusGeometry(1.0, .1, 8, game ? 32 : 48), coral, 0, 2.06, 0); rim2.rotation.x = Math.PI / 2;
  mesh(f, G.c, water, 0, 2.08, 0, .9, .03, .9, 'PZ_water2');
  const sg = new THREE.ExtrudeGeometry(starShape(), { depth: .35, bevelEnabled: true, bevelThickness: .14, bevelSize: .12, bevelSegments: 2 }); sg.center();
  mesh(f, sg, M('#FFD36E', { metalness: .4, roughness: .25, emissive: '#7A5200', emissiveIntensity: .3 }), 0, 2.72, 0, .3, .3, .3, 'PZ_star');
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; mesh(f, G.ss, M('#FFE27A', { emissive: '#FFB800', emissiveIntensity: .25 }), Math.cos(a) * 2.05, .82, Math.sin(a) * 2.05, .09, .09, .09); }
  // 꽃밭·덤불·가로등·벤치: 길이 나가는 방향은 비워 둔다
  const far = (a, gap = .4) => pathAngles.every(p => Math.abs(Math.atan2(Math.sin(a - p), Math.cos(a - p))) > gap);
  const petal = ['#FF8FB1', '#FFE07A', '#FFFFFF', '#B99CFF', '#FFB27A'];
  let beds = 0, lamps = 0, benches = 0;
  for (let i = 0; i < 36; i++) {
    const a = i / 36 * TAU; if (!far(a)) continue;
    const x = Math.cos(a) * 5.05, z = Math.sin(a) * 5.05;
    if (i % 3 === 0) {
      const bed = grp(root, 'PZ_bed' + beds++, x, 0, z); bed.rotation.y = -a;
      mesh(bed, K.G.c, M('#C98F5C', { roughness: .8 }), 0, .12, 0, .62, .24, .62);
      mesh(bed, K.G.s, M('#7ED67F', { roughness: .8 }), 0, .26, 0, .6, .2, .6);
      for (let k = 0; k < 8; k++) { const aa = k / 8 * TAU, rr = .18 + (k % 3) * .13; mesh(bed, K.G.ss, M(petal[(k + i) % 5], { roughness: .6 }), Math.cos(aa) * rr, .44 + (k % 2) * .05, Math.sin(aa) * rr, .11, .09, .11); }
    } else {
      const r = .32 + (i % 2) * .08; mesh(root, K.G.s, M(i % 2 ? '#8FDB86' : '#A6E596', { roughness: .85 }), x, r * .8, z, r, r * .85, r);
      if (i % 2) mesh(root, K.G.ss, M(petal[i % 5]), x + .1, r * 1.45, z, .08, .07, .08);
    }
  }
  // 가로등: 길 사이 가장 넓은 빈 곳 4군데
  const sorted = pathAngles.slice().sort((p, q) => p - q), gaps = sorted.map((p, i) => { const q = sorted[(i + 1) % sorted.length] + (i === sorted.length - 1 ? TAU : 0); return [q - p, (p + q) / 2]; }).sort((u, v) => v[0] - u[0]);
  for (const [, a] of gaps.slice(0, 4)) {
    const lp = grp(root, 'PZ_lamp' + lamps++, Math.cos(a) * 5.9, 0, Math.sin(a) * 5.9);
    mesh(lp, K.G.c, M('#5A4E72', { roughness: .5 }), 0, 1.2, 0, .07, 2.4, .07);
    mesh(lp, K.G.s, M('#FFF3C4', { emissive: '#FFD27A', emissiveIntensity: .9 }), 0, 2.5, 0, .26, .3, .26, 'PZ_lampGlow' + lamps);
    mesh(lp, K.G.cone, M('#FF8E9E'), 0, 2.84, 0, .3, .28, .3);
  }
  // 벤치 2개 (분수를 바라본다)
  for (const [, a] of gaps.slice(0, 2)) {
    const bx = Math.cos(a + .32) * 3.7, bz = Math.sin(a + .32) * 3.7, bn = grp(root, 'PZ_bench' + benches++, bx, 0, bz); bn.rotation.y = -a - .32 - Math.PI / 2;
    mesh(bn, new THREE.BoxGeometry(1.4, .12, .45), M('#E9A86B', { roughness: .6 }), 0, .45, 0); mesh(bn, new THREE.BoxGeometry(1.4, .4, .1), M('#E9A86B', { roughness: .6 }), 0, .72, -.2);
    for (const sx of [-.55, .55]) mesh(bn, new THREE.BoxGeometry(.1, .45, .4), M('#7A6A92'), sx, .22, 0);
  }
  root.userData.counts = { beds, lamps, benches };
  return { root, kit: K };
}
