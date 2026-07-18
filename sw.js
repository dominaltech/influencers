// ========================================================
// CityFame Service Worker (Cache-First Shell Strategy)
// ========================================================

const CACHE_NAME = 'cityfame-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/welcome.html',
    '/index.html',
    '/influencers.html',
    '/about.html',
    '/assets/style.css',
    '/assets/app.js',
    '/assets/supabase-client.js',
    '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('CityFame SW: Pre-caching static app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event (Cache Cleanup)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('CityFame SW: Clearing old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event (Cache First, Fallback to Network)
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    // Skip Supabase API calls from SW cache to keep dynamic data live
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                // Return network response directly
                return networkResponse;
            }).catch(() => {
                // If offline and request is an HTML page, serve index/welcome fallback
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
