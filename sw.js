// ========================================================
// CityFame Service Worker (Network-First Strategy with Offline Fallback)
// ========================================================

const CACHE_NAME = 'cityfame-cache-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/welcome.html',
    '/index.html',
    '/influencers.html',
    '/about.html',
    '/enquiries.html',
    '/settings.html',
    '/assets/style.css',
    '/assets/app.js',
    '/assets/supabase-client.js',
    '/manifest.json'
];

// Install Event - Pre-cache Static Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('CityFame SW: Pre-caching app shell assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event - Instantly Delete All Old Cache Versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('CityFame SW: Purging old cache version:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Network-First Strategy (Instant Live Deployment + Offline Cache Fallback)
self.addEventListener('fetch', (event) => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    // Skip Supabase API calls from SW cache to keep dynamic database queries live
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If valid network response, update cache in background
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If offline or network fails, fallback to cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If HTML page request and not in cache, fallback to index.html
                    if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

