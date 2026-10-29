// 말랑 펫하우스 오프라인 캐시.
// 게임 파일을 바꿔 다시 올릴 때는 VERSION 숫자를 올려야 기존 설치본도 새 파일을 받는다.
const VERSION = 'malang-v8';
const FILES = [
  './',
  'index.html',
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

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 캐시 우선: 인터넷이 없어도 바로 켜진다. 캐시에 없으면 받아 와서 저장한다.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
  );
});
