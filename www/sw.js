// 말랑 펫하우스 오프라인 캐시.
// 게임 파일을 바꿔 다시 올릴 때는 VERSION 숫자를 올려야 기존 설치본도 새 파일을 받는다.
const VERSION = 'malang-v38';
// 꼭 있어야 하는 파일: 하나라도 없으면 새 버전 설치를 멈추고 예전 버전을 계속 쓴다
const CORE = [
  './',
  'index.html',
  'privacy.html',
  'manifest.webmanifest',
  'fonts/Jua-Regular.woff2',
  'fonts/GowunDodum-Regular.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-192.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
  'vendor/three.min.js'
];
// 있으면 좋은 파일(새 3D 그래픽): 받지 못해도 설치는 계속되고, 게임은 예전 그래픽으로 켜진다
const OPTIONAL = [
  'vendor/GLTFLoader.js',
  'models/malang_bear.glb',
  'models/malang_plaza.glb'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(CORE).then(() => Promise.all(OPTIONAL.map(f => c.add(f).catch(() => {})))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => {
        const old = keys.filter(k => k !== VERSION);
        return Promise.all(old.map(k => caches.delete(k)))
          .then(() => self.clients.claim())
          // 예전 버전을 쓰던 화면: 보이는 화면에는 알려서 놀이가 끝난 뒤 다시 열게 하고, 뒤에 있는 화면은 바로 다시 연다
          .then(() => old.length ? self.clients.matchAll({ type: 'window' }) : [])
          .then(list => Promise.all(list.map(c => c.visibilityState === 'visible' ? c.postMessage({ type: 'malang-updated' }) : c.navigate(c.url).catch(() => {}))));
      })
  );
});

// 게임 화면은 네트워크 우선: 새 버전이 있으면 바로 받고, 인터넷이 없으면 저장본으로 켠다.
// 나머지 파일은 캐시 우선: 빠르게 켜진다. 캐시에 없으면 받아 와서 저장한다.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); }
      return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
  );
});
