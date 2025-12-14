// Stacker 3D Service Worker
const CACHE_NAME = 'stacker-3d-cache-v1';
const RUNTIME_CACHE = 'stacker-runtime-cache-v1';

// Static assets to precache
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install - cache static assets including HTML, CSS, JS
self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[ServiceWorker] Caching app shell (HTML, CSS, JS)');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(function() {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate - clean old caches
self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function() {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch - cache HTML, CSS, JS and serve when offline
self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);
  
  // Only handle same-origin requests
  if (requestUrl.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        // Serve from cache if available
        if (cachedResponse) {
          console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        console.log('[ServiceWorker] Fetching from network:', event.request.url);
        
        // Fetch from network
        return fetch(event.request)
          .then(function(networkResponse) {
            // Check if valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }

            // Cache HTML, CSS, JS, images
            const responseToCache = networkResponse.clone();
            const url = event.request.url;
            
            if (url.endsWith('.html') || 
                url.endsWith('.css') || 
                url.endsWith('.js') || 
                url.endsWith('.png') || 
                url.endsWith('.jpg') || 
                url.endsWith('.json') ||
                url === requestUrl.origin + '/') {
              
              caches.open(RUNTIME_CACHE)
                .then(function(cache) {
                  console.log('[ServiceWorker] Caching resource:', url);
                  cache.put(event.request, responseToCache);
                });
            }

            return networkResponse;
          })
          .catch(function(error) {
            console.log('[ServiceWorker] Fetch failed, serving from cache:', error);
            
            // Return cached version or fallback
            return caches.match(event.request)
              .then(function(response) {
                return response || caches.match('/index.html');
              });
          });
      })
  );
});
