// ═══════════════════════════════════
// SERVICE WORKER — offline app shell
// ═══════════════════════════════════
// Cache-first for the static app shell so the tool works fully offline once
// installed. Bump CACHE on any asset change to force a refresh. Google Fonts
// are best-effort (runtime cache); the CSS declares system fallbacks.

const CACHE = 'hrd-explorer-v4';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/main.css',
  './js/main.js',
  './js/physics.js',
  './js/format.js',
  './js/stars.js',
  './js/coords.js',
  './js/hrd-renderer.js',
  './js/preview-renderer.js',
  './js/ui.js',
  './js/interaction.js',
  './js/theme.js',
  './js/understand.js',
  './js/share.js',
  './js/quiz.js',
  './js/tour.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          // Runtime-cache successful same-origin and font responses.
          if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        // Offline fallback: only page navigations get the app shell —
        // returning HTML for a failed image/font request would corrupt it.
        .catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
