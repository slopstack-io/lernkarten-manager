const CACHE_NAME = 'lernkarten-v1';
const BASE = '/lernkarten';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(`${BASE}/index.html`)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok && (e.request.url.includes('/assets/') || e.request.url.includes('/icon-'))) {
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, res.clone()));
      }
      return res;
    })));
  }
});
