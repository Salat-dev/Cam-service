// ═══════════════════════════════════════════════════════════════
// PWA REGISTRATION - travailici
// À inclure dans toutes les pages
// ═══════════════════════════════════════════════════════════════

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('✅ Service Worker enregistré:', registration.scope);
            
            // Vérifier les mises à jour
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 Nouveau Service Worker en cours d\'installation...');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🆕 Nouvelle version disponible !');
                        showUpdateNotification(registration);
                    }
                });
            });
            
            // Vérifier périodiquement les mises à jour
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000); // Toutes les heures
            
        } catch (error) {
            console.error('❌ Erreur d\'enregistrement du Service Worker:', error);
        }
    });
}

// Notification de mise à jour
function showUpdateNotification(registration) {
    if (window.updateBanner) return;
    
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `
        position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
        background:#22C55E; color:#fff; padding:12px 24px;
        border-radius:12px; font-family:'Inter',sans-serif;
        font-size:.875rem; font-weight:600; z-index:10000;
        box-shadow:0 8px 32px rgba(34,197,94,.3);
        display:flex; align-items:center; gap:12px;
        cursor:pointer; animation:slideUp .3s ease;
    `;
    banner.textContent = '🆕 Nouvelle version disponible — Cliquez pour actualiser';
    banner.onclick = () => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    };
    
    document.body.appendChild(banner);
    window.updateBanner = true;
    
    setTimeout(() => banner.remove(), 10000);
}

// Installation de la PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Afficher le bouton d'installation personnalisé
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.style.display = 'flex';
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`📱 PWA installée: ${outcome}`);
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }
});

// Détecter si l'application est déjà installée
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installée avec succès !');
    deferredPrompt = null;
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) installBtn.style.display = 'none';
});

// Vérifier le mode d'affichage
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 Affichage en mode standalone (PWA installée)');
}