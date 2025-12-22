// service-worker.js fayli (alohida fayl sifatida yaratish kerak)

const CACHE_NAME = '1xbet-signals-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://i.ibb.co/fVPq08Xq/1xbet-logo.png'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache ochildi');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Barcha resurslar cache ga saqlandi');
                return self.skipWaiting();
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eski cache o\'chirilmoqda:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker faollashtirildi');
            return self.clients.claim();
        })
    );
});

// Fetch event - Network first strategy
self.addEventListener('fetch', event => {
    // Telegram yoki maxsus URL lar uchun cache dan foydalanmaslik
    if (event.request.url.includes('telegram') || 
        event.request.url.includes('tgWebApp') ||
        event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Agar offline bo'lsa, cache dan olib berish
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // Boshqa requestlar uchun cache first strategy
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Agar cache da topilsa
                if (response) {
                    return response;
                }
                
                // Cache da yo'q bo'lsa, network dan so'rash
                return fetch(event.request)
                    .then(response => {
                        // Response ni cache ga saqlash
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Agar network ham ishlamasa
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return new Response('Offline mode');
                    });
            })
    );
});

// Push notification (kelajakda foydalanish uchun)
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: 'https://i.ibb.co/fVPq08Xq/1xbet-logo.png',
        badge: 'https://i.ibb.co/fVPq08Xq/1xbet-logo.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Ochish',
                icon: 'https://i.ibb.co/fVPq08Xq/1xbet-logo.png'
            },
            {
                action: 'close',
                title: 'Yopish',
                icon: 'https://i.ibb.co/fVPq08Xq/1xbet-logo.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('1xBet Signals', options)
    );
});

// Notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('https://1xbet.com')
        );
    }
});
