// CyberBroker Service Worker v1.0
const CACHE_NAME = 'cyberbroker-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/vendor/chart.umd.min.js',
  '/vendor/lucide.min.js',
  '/fonts/fonts.css'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate – purge old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch – cache-first for static, network-first for dynamic
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // CDN resources – network first with cache fallback
  if (url.hostname !== location.hostname) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Local assets – cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      });
    })
  );
});

// Background sync for offline trades
self.addEventListener('sync', event => {
  if (event.tag === 'sync-trades') {
    event.waitUntil(syncOfflineTrades());
  }
});

async function syncOfflineTrades() {
  // In a real implementation this would push pending trades to a server
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'SYNC_COMPLETE' }));
}
