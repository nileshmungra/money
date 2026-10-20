/* Money Manager service worker.
   index.html: network-first (navi file aave to turant update), offline ma cache.
   Baki files + Chart.js/XLSX CDN: cache-first, offline chale. */
const CACHE = 'money-v3';
const LOCAL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const CDN = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled([
      ...LOCAL.map(u => c.add(u)),
      ...CDN.map(u => c.add(new Request(u, { mode: 'no-cors' })))
    ]);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/index.html');
  if (isPage) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok) (await caches.open(CACHE)).put('./index.html', res.clone());
        return res;
      } catch (_) {
        return (await caches.match('./index.html', { ignoreSearch: true })) || Response.error();
      }
    })());
    return;
  }
  if (url.origin !== location.origin && !CDN.includes(req.url)) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch (_) {
      return Response.error();
    }
  })());
});
