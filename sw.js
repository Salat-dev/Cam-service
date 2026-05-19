// ═══════════════════════════════════════════
// SERVICE WORKER — CamServices PWA
// ═══════════════════════════════════════════

const CACHE_NAME = 'camservices-v2';
const urlsToCache = [
    '/',
    '/landing.html',
    '/services.html',
    '/cart.html',
    '/contact.html',
    '/help.html',
    '/privacy.html',
    '/terms.html',
    '/guide-prestataire.html',
    '/login-client.html',
    '/register.html',
    '/register-client.html',
    '/service-detail.html',
    '/service-registration.html',
    '/portfolio-registration.html',
    '/confirm-order.html',
    '/css/global.css',
    '/css/dashboard.css',
    '/css/ultra-responsive.css',
    '/js/global.js',
    '/js/services.js',
    '/js/service-detail.js',
    '/js/client-auth.js',
    '/js/ultra-responsive.js',
    '/js/bottom-navbar.js',
    '/asset/logo.svg',
    '/asset/logo-light.svg',
    '/asset/favicon.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://unpkg.com/lucide@latest'
];

// Installation
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Cache ouvert');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.warn('⚠️ Cache partiel:', err);
            })
    );
    self.skipWaiting();
});

// Activation
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Ancien cache supprimé:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Stratégie : Network First, fallback cache
self.addEventListener('fetch', event => {
    // Ignorer les requêtes Supabase (API)
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Mettre en cache les réponses réussies
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback : servir depuis le cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Page offline par défaut
                        if (event.request.mode === 'navigate') {
                            return caches.match('/landing.html');
                        }
                        return new Response('Hors ligne', { status: 503 });
                    });
            })
    );
});

// Notification push
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const options = {
        body: data.body || 'Nouvelle notification CamServices',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Ouvrir' },
            { action: 'close', title: 'Fermer' }
        ]
    };
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'CamServices',
            options
        )
    );
});

// Clic sur notification
self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'open' || !event.action) {
        const url = event.notification.data.url || '/';
        event.waitUntil(
            clients.openWindow(url)
        );
    }
});