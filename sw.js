const CACHE_NAME = 'almuntalaq-v6-1792047500';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './data/almuntalaq_data.js',
  './data/almuntalaq_data.json',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell v3');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Hanya proses request kaedah GET
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Strategi Network-First untuk Navigasi (HTML), Data JS/JSON, dan App JS
  const isHtml = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.search.includes('v=');
  const isDynamicContent = url.pathname.includes('/data/') || url.pathname.includes('/js/');

  if (isHtml || isDynamicContent) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Bila tiada internet (offline), gunakan cache
          return caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || (isHtml ? caches.match('./index.html') : null);
          });
        })
    );
    return;
  }

  // Cache-First untuk aset statik (imej, ikon, css, pdf)
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && e.request.url.startsWith('http')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
