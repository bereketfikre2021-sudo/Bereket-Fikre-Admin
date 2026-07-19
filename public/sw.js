/**
 * Admin PWA Service Worker
 * Strategy:
 *   - App shell (JS/CSS/HTML): cache-first, update in background
 *   - API requests:            network-first, no cache
 *   - Images/fonts:            cache-first, long TTL
 */

const CACHE     = 'bf-admin-v1';
const API_REGEX = /\/api\//;

// On install — pre-cache the app shell
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(['/', '/manifest.json', '/icon-192.png', '/icon-512.png'])
        .catch(() => {}) // non-fatal — network may be unavailable
    )
  );
});

// On activate — delete old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Never cache API, auth, or non-GET
  if (request.method !== 'GET' || API_REGEX.test(url.pathname)) return;

  // Cache-first for same-origin assets (JS, CSS, images, fonts)
  e.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((res) => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      });
      return cached || fetchPromise;
    })
  );
});
