const CACHE_NAME = 'skyflow-cache-v2';
const STATIC_CACHE = 'skyflow-static-v2';
const DYNAMIC_CACHE = 'skyflow-dynamic-v2';

const ASSETS_TO_CACHE = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Clean up old cache versions
          if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE && cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Determine the caching strategy for a request.
 * - Static assets (fonts, images, CSS, JS bundles) → CacheFirst
 * - Flight search results & navigation pages → StaleWhileRevalidate
 * - API mutations (POST, PUT, DELETE) → Network only
 */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname === '/manifest.json'
  );
}

function isFlightSearchOrPage(url) {
  return (
    url.pathname === '/flights' ||
    url.pathname.startsWith('/flights') ||
    url.pathname === '/my-bookings' ||
    url.pathname.startsWith('/my-bookings') ||
    url.pathname === '/'
  );
}

self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests (mutations should always go to network)
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API routes — always network
  if (event.request.url.includes('/api/')) {
    return;
  }

  const url = new URL(event.request.url);

  // Strategy: CacheFirst for static assets
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => Response.error());
      })
    );
    return;
  }

  // Strategy: StaleWhileRevalidate for flight search results and pages
  if (isFlightSearchOrPage(url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed — if we have a cached response, it was already returned
            // If not, fall through to offline page
            if (cachedResponse) return cachedResponse;
            if (event.request.mode === 'navigate' || event.request.destination === 'document') {
              return caches.match('/offline').then((offlineResponse) => {
                return offlineResponse || new Response('You are offline.', {
                  status: 503,
                  headers: { 'Content-Type': 'text/plain' }
                });
              });
            }
            return Response.error();
          });

        // Return cached immediately (stale), revalidate in background
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network first with cache fallback + offline page for navigation
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate' || event.request.destination === 'document') {
            return caches.match('/offline').then((offlineResponse) => {
              if (offlineResponse) return offlineResponse;
              return caches.match('/').then((homeResponse) => {
                if (homeResponse) return homeResponse;
                return new Response('You are offline. Please check your connection.', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({ 'Content-Type': 'text/plain' })
                });
              });
            });
          }
          return Response.error();
        });
      })
  );
});
