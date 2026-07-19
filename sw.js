// ========================================================
// CityFame Service Worker (Dynamic Version-less Auto-Updating Strategy)
// Always serves live website updates instantly, with offline fallback.
// ========================================================

const DYNAMIC_CACHE_NAME = 'cityfame-app-shell-live';
const ASSETS_TO_CACHE = [
    '/',
    '/welcome.html',
    '/index.html',
    '/influencers.html',
    '/profile.html',
    '/about.html',
    '/enquiries.html',
    '/settings.html',
    '/assets/style.css',
    '/assets/app.js',
    '/assets/supabase-client.js',
    '/manifest.json'
];

// Install Event - Pre-cache Static Shell & Instantly Skip Waiting
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            console.log('CityFame SW: Pre-caching live app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event - Instantly Claim Clients & Clean Up Old Cache Stores
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== DYNAMIC_CACHE_NAME) {
                        console.log('CityFame SW: Purging legacy cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Live Network First (Direct Updates) with Offline Cache Fallback
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Skip Supabase database API requests from SW cache
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If live network fetch succeeds, cache fresh copy and return immediately
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseClone = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If offline or network fails, serve cached version
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Push Event - Receive & Display Native Android/Web Push Notifications
self.addEventListener('push', (event) => {
    let data = {
        title: 'CityFame Notification',
        body: 'You have a new brand enquiry on CityFame',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        data: { url: '/enquiries.html' }
    };

    if (event.data) {
        try {
            data = Object.assign(data, event.data.json());
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/logo.png',
        badge: data.badge || '/logo.png',
        vibrate: data.vibrate || [200, 100, 200],
        tag: 'cityfame-push-notification',
        renotify: true,
        data: data.data || { url: '/enquiries.html' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification Click Event - Open App or Enquiries Page
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/enquiries.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});


