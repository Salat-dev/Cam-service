// ═══════════════════════════════════════════════════════════════
// SERVICE WORKER - travailici PWA
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'travailici-v2.1.0';
const RUNTIME_CACHE = 'travailici-runtime-v2';

// Ressources à mettre en cache immédiatement (stratégie Cache First)
const PRECACHE_ASSETS = [
    '/',
    '/services.html',
    '/cart.html',
    '/login-client.html',
    '/register.html',
    '/offline.html',
    
    // CSS
    '/css/global.css',
    '/css/utils.css',
    '/css/ultra-responsive.css',
    '/css/bottom-navbar.css',
    
    // JS
    '/js/global.js',
    '/js/bottom-navbar.js',
    '/js/ultra-responsive.js',
    
    // Dashboard
    '/dashboard/index.html',
    '/dashboard/services.html',
    '/dashboard/orders.html',
    '/dashboard/profile.html',
    '/dashboard/pricing.html',
    '/dashboard/portfolio.html',
    '/dashboard/activities.html',
    '/dashboard/analytics.html',
    '/dashboard/css/dashboard.css',
    '/dashboard/js/admin-common.js',
    '/dashboard/js/admin-dashboard.js',
    
    // Admin
    '/admin/index.html',
    '/admin/css/admin.css',
    '/admin/js/admin-common.js',
    
    // Assets
    '/asset/logo camservices.svg',
    '/asset/logo.svg',
    '/asset/icons/icon-192x192.png',
    '/asset/icons/icon-512x512.png',
    '/asset/icons/maskable-icon-512x512.png',
    
    // Fonts
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    
    // CDN
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// ═══════════════════════════════════════════
// INSTALLATION
// ═══════════════════════════════════════════
self.addEventListener('install', (event) => {
    console.log('🟢 Service Worker: Installation...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Mise en cache des ressources précachées');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker installé avec succès');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Erreur lors de la mise en cache:', error);
            })
    );
});

// ═══════════════════════════════════════════
// ACTIVATION
// ═══════════════════════════════════════════
self.addEventListener('activate', (event) => {
    console.log('🔵 Service Worker: Activation...');
    
    const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE];
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (!cacheWhitelist.includes(cacheName)) {
                            console.log('🗑️ Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activé');
                return self.clients.claim();
            })
    );
});

// ═══════════════════════════════════════════
// STRATÉGIE DE CACHE
// ═══════════════════════════════════════════

// Cache First — Pour les ressources statiques
function cacheFirst(request) {
    return caches.match(request)
        .then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(request)
                .then((response) => {
                    // Ne pas mettre en cache les réponses non valides
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    caches.open(RUNTIME_CACHE)
                        .then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    
                    return response;
                });
        });
}

// Network First — Pour les API et données dynamiques
function networkFirst(request) {
    return fetch(request)
        .then((response) => {
            if (!response || response.status !== 200) {
                return response;
            }
            
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
                .then((cache) => {
                    cache.put(request, responseToCache);
                });
            
            return response;
        })
        .catch(() => {
            return caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Si c'est une page HTML, retourner la page offline
                    if (request.headers.get('Accept').includes('text/html')) {
                        return caches.match('/offline.html');
                    }
                    return new Response('', { status: 408, statusText: 'Network timeout' });
                });
        });
}

// ═══════════════════════════════════════════
// FETCH — Gestion des requêtes
// ═══════════════════════════════════════════
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorer les requêtes non GET
    if (request.method !== 'GET') return;
    
    // Ignorer les requêtes Supabase API (gérées par le SDK)
    if (url.hostname.includes('supabase.co')) return;
    
    // Ignorer les requêtes chrome-extension
    if (url.protocol === 'chrome-extension:') return;
    
    // Stratégies selon le type de ressource
    if (request.headers.get('Accept').includes('text/html')) {
        // Pages HTML : Network First avec fallback offline
        event.respondWith(networkFirst(request));
    } else if (
        request.url.includes('/css/') ||
        request.url.includes('/js/') ||
        request.url.includes('/asset/') ||
        request.url.includes('fonts.googleapis.com') ||
        request.url.includes('unpkg.com') ||
        request.url.includes('cdn.jsdelivr.net')
    ) {
        // Ressources statiques : Cache First
        event.respondWith(cacheFirst(request));
    } else if (
        request.url.includes('/api/') ||
        request.url.includes('supabase')
    ) {
        // API : Network First
        event.respondWith(networkFirst(request));
    } else {
        // Par défaut : Network First
        event.respondWith(networkFirst(request));
    }
});

// ═══════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════
self.addEventListener('push', (event) => {
    console.log('📨 Notification push reçue:', event);
    
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = {
                title: 'travailici',
                body: event.data.text()
            };
        }
    }
    
    const options = {
        body: data.body || 'Vous avez une nouvelle notification',
        icon: '/asset/icons/icon-192x192.png',
        badge: '/asset/icons/icon-96x96.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: data.actions || [
            {
                action: 'open',
                title: 'Voir'
            },
            {
                action: 'close',
                title: 'Fermer'
            }
        ],
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
    };
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'travailici',
            options
        )
    );
});

// ═══════════════════════════════════════════
// CLIC SUR NOTIFICATION
// ═══════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Clic sur notification:', event);
    
    event.notification.close();
    
    if (event.action === 'close') return;
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((clientList) => {
            // Chercher un onglet déjà ouvert
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    return client.navigate(urlToOpen);
                }
            }
            // Ouvrir un nouvel onglet
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ═══════════════════════════════════════════
// SYNC EN ARRIÈRE-PLAN
// ═══════════════════════════════════════════
self.addEventListener('sync', (event) => {
    console.log('🔄 Background Sync:', event.tag);
    
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncPendingOrders());
    } else if (event.tag === 'sync-profile') {
        event.waitUntil(syncProfileData());
    }
});

async function syncPendingOrders() {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        const pendingOrders = await cache.match('/pending-orders');
        
        if (pendingOrders) {
            const orders = await pendingOrders.json();
            console.log('📤 Synchronisation des commandes en attente:', orders.length);
            // Logique de synchronisation
        }
    } catch (error) {
        console.error('❌ Erreur sync orders:', error);
    }
}

async function syncProfileData() {
    try {
        console.log('📤 Synchronisation du profil...');
        // Logique de synchronisation
    } catch (error) {
        console.error('❌ Erreur sync profile:', error);
    }
}

// ═══════════════════════════════════════════
// MESSAGE DEPUIS L'APPLICATION
// ═══════════════════════════════════════════
self.addEventListener('message', (event) => {
    console.log('📩 Message reçu:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    }
    
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        event.waitUntil(
            self.registration.update()
        );
    }
});