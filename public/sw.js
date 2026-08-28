const VERSION = 'actuals-v3';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const CORE = ['/', '/index.html', '/demo/', '/demo/index.html', '/privacy/', '/privacy/index.html', '/terms/', '/terms/index.html', '/404/', '/404/index.html', '/offline.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/apple-touch-icon.png', '/og-image.webp', '/assets/dependency-still-life-720.webp', '/assets/dependency-still-life-1200.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(CORE);
    try {
      const index = await (await cache.match('/index.html')).text();
      const hashed = [...index.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
      await cache.addAll(hashed);
    } catch (_) { /* runtime caching still covers a partial install */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => ![SHELL, RUNTIME].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.postMessage({ type: 'UPDATE_AVAILABLE' }));
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    if (url.hostname.endsWith('sociobot.in')) event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        (await caches.open(RUNTIME)).put(request, fresh.clone());
        return fresh;
      } catch (_) {
        const known = ['/', '/demo', '/demo/', '/privacy', '/privacy/', '/terms', '/terms/', '/404', '/404/'];
        if (!known.includes(url.pathname)) return (await caches.match('/404/index.html')) || (await caches.match('/offline.html'));
        const fallback = url.pathname.startsWith('/demo') ? '/demo/index.html' : url.pathname.startsWith('/privacy') ? '/privacy/index.html' : url.pathname.startsWith('/terms') ? '/terms/index.html' : '/index.html';
        return (await caches.match(request)) || (await caches.match(fallback)) || (await caches.match('/offline.html'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) (await caches.open(RUNTIME)).put(request, response.clone());
    return response;
  })());
});
