// ═══════════════════════════════════════════════════════════════
// PWA INSTALL — travailici
// Affiche un bouton d'installation PWA personnalisé
// ═══════════════════════════════════════════════════════════════

(function() {
    'use strict';

    let deferredPrompt = null;
    let installButton = null;
    let isInstalled = false;

    // ═══════════════════════════════════════════
    // DÉTECTER SI DÉJÀ INSTALLÉ
    // ═══════════════════════════════════════════
    function checkIfInstalled() {
        // Vérifier si l'application est en mode standalone (installée)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 PWA déjà installée (mode standalone)');
            return true;
        }
        
        // Vérifier si sur iOS Safari (pas de support beforeinstallprompt)
        if (navigator.standalone) {
            console.log('📱 PWA déjà installée (iOS standalone)');
            return true;
        }
        
        return false;
    }

    // ═══════════════════════════════════════════
    // CRÉER LE BOUTON D'INSTALLATION
    // ═══════════════════════════════════════════
    function createInstallButton() {
        // Ne pas créer si déjà installé
        if (isInstalled) return;
        
        // Ne pas créer si le bouton existe déjà
        if (document.getElementById('pwa-install-btn')) return;
        
        // Créer le conteneur flottant
        const container = document.createElement('div');
        container.id = 'pwa-install-container';
        container.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            animation: pwaSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            display: none;
        `;
        
        // Créer le bouton
        installButton = document.createElement('button');
        installButton.id = 'pwa-install-btn';
        installButton.className = 'pwa-install-button';
        installButton.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 28px;
            background: linear-gradient(135deg, #22C55E, #16A34A);
            color: #FFFFFF;
            border: none;
            border-radius: 16px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 0.9375rem;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(34, 197, 94, 0.35);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            white-space: nowrap;
            letter-spacing: -0.01em;
            -webkit-tap-highlight-color: transparent;
        `;
        
        // Icône + Texte
        installButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Installer l'application</span>
        `;
        
        // Effet hover
        installButton.addEventListener('mouseenter', () => {
            installButton.style.transform = 'translateY(-2px)';
            installButton.style.boxShadow = '0 12px 40px rgba(34, 197, 94, 0.45)';
        });
        
        installButton.addEventListener('mouseleave', () => {
            installButton.style.transform = 'translateY(0)';
            installButton.style.boxShadow = '0 8px 32px rgba(34, 197, 94, 0.35)';
        });
        
        // Effet clic
        installButton.addEventListener('mousedown', () => {
            installButton.style.transform = 'scale(0.97)';
        });
        
        installButton.addEventListener('mouseup', () => {
            installButton.style.transform = 'scale(1)';
        });
        
        // Action d'installation
        installButton.addEventListener('click', async () => {
            await installPWA();
        });
        
        // Bouton fermer
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            width: 28px;
            height: 28px;
            background: #FFFFFF;
            border: 2px solid #E5E7EB;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.75rem;
            color: #6B7280;
            transition: all 0.2s;
            z-index: 1;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        closeButton.innerHTML = '✕';
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            hideInstallButton();
        });
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = '#FEF2F2';
            closeButton.style.color = '#EF4444';
            closeButton.style.borderColor = '#EF4444';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = '#FFFFFF';
            closeButton.style.color = '#6B7280';
            closeButton.style.borderColor = '#E5E7EB';
        });
        
        container.appendChild(installButton);
        container.appendChild(closeButton);
        document.body.appendChild(container);
        
        // Ajouter l'animation CSS
        if (!document.getElementById('pwa-install-styles')) {
            const styles = document.createElement('style');
            styles.id = 'pwa-install-styles';
            styles.textContent = `
                @keyframes pwaSlideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                
                @keyframes pwaSlideDown {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                }
                
                @keyframes pwaPulse {
                    0%, 100% { box-shadow: 0 8px 32px rgba(34, 197, 94, 0.35); }
                    50% { box-shadow: 0 8px 48px rgba(34, 197, 94, 0.6); }
                }
                
                .pwa-install-button {
                    animation: pwaPulse 2s ease-in-out infinite;
                }
                
                .pwa-install-button:hover {
                    animation: none;
                }
                
                @media (max-width: 480px) {
                    #pwa-install-btn {
                        font-size: 0.8125rem;
                        padding: 12px 22px;
                        border-radius: 14px;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        console.log('✅ Bouton d\'installation PWA créé');
    }

    // ═══════════════════════════════════════════
    // AFFICHER LE BOUTON
    // ═══════════════════════════════════════════
    function showInstallButton() {
        if (isInstalled) return;
        
        const container = document.getElementById('pwa-install-container');
        if (container) {
            container.style.display = 'block';
            container.style.animation = 'pwaSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            console.log('📱 Bouton d\'installation affiché');
        }
    }

    // ═══════════════════════════════════════════
    // CACHER LE BOUTON
    // ═══════════════════════════════════════════
    function hideInstallButton() {
        const container = document.getElementById('pwa-install-container');
        if (container) {
            container.style.animation = 'pwaSlideDown 0.3s ease forwards';
            setTimeout(() => {
                container.style.display = 'none';
            }, 300);
            console.log('📱 Bouton d\'installation masqué');
        }
        
        // Sauvegarder le choix de l'utilisateur (ne plus afficher pendant 3 jours)
        localStorage.setItem('pwa-install-dismissed', Date.now());
    }

    // ═══════════════════════════════════════════
    // INSTALLER LA PWA
    // ═══════════════════════════════════════════
    async function installPWA() {
        if (!deferredPrompt) {
            // Fallback pour iOS ou navigateurs sans beforeinstallprompt
            showIOSInstructions();
            return;
        }
        
        try {
            // Afficher le prompt d'installation natif
            await deferredPrompt.prompt();
            
            // Attendre le choix de l'utilisateur
            const { outcome } = await deferredPrompt.userChoice;
            
            console.log(`📱 Résultat installation: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('✅ PWA installée avec succès !');
                hideInstallButton();
                isInstalled = true;
                deferredPrompt = null;
                
                // Sauvegarder que l'utilisateur a installé
                localStorage.setItem('pwa-installed', 'true');
                
                // Notification de succès
                showInstallSuccess();
            } else {
                console.log('❌ Installation refusée');
                hideInstallButton();
            }
        } catch (error) {
            console.error('❌ Erreur installation:', error);
        }
    }

    // ═══════════════════════════════════════════
    // INSTRUCTIONS POUR iOS
    // ═══════════════════════════════════════════
    function showIOSInstructions() {
        // Supprimer l'ancienne modale si elle existe
        const existing = document.getElementById('pwa-ios-modal');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'pwa-ios-modal';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 10001;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 20px;
            animation: pwaFadeIn 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: #FFFFFF;
                border-radius: 20px;
                padding: 32px 24px;
                width: 100%;
                max-width: 420px;
                text-align: center;
                animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            ">
                <div style="
                    width: 64px;
                    height: 64px;
                    background: #F0FDF4;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    font-size: 2rem;
                ">
                    📱
                </div>
                <h3 style="font-weight:700;font-size:1.2rem;margin-bottom:8px;color:#111827">
                    Installer travailici
                </h3>
                <p style="font-size:0.875rem;color:#6B7280;margin-bottom:24px;line-height:1.6">
                    Pour installer l'application sur votre iPhone/iPad :
                </p>
                <div style="
                    background: #F9FAFB;
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                    text-align: left;
                ">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                        <span style="
                            width: 28px;height: 28px;
                            background: #22C55E;color: #fff;
                            border-radius: 50%;display:flex;
                            align-items:center;justify-content:center;
                            font-weight:700;font-size:0.8125rem;flex-shrink:0;
                        ">1</span>
                        <span style="font-size:0.8125rem;color:#374151">
                            Appuyez sur le bouton <strong style="color:#22C55E">Partager</strong> 
                            <span style="font-size:1.2rem">⎋</span> en bas de l'écran
                        </span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                        <span style="
                            width: 28px;height: 28px;
                            background: #22C55E;color: #fff;
                            border-radius: 50%;display:flex;
                            align-items:center;justify-content:center;
                            font-weight:700;font-size:0.8125rem;flex-shrink:0;
                        ">2</span>
                        <span style="font-size:0.8125rem;color:#374151">
                            Sélectionnez <strong style="color:#22C55E">Sur l'écran d'accueil</strong> 📲
                        </span>
                    </div>
                </div>
                <button onclick="document.getElementById('pwa-ios-modal').remove()" style="
                    width:100%;
                    padding:14px;
                    background:#22C55E;
                    color:#fff;
                    border:none;
                    border-radius:12px;
                    font-family:'Inter',sans-serif;
                    font-weight:600;
                    font-size:0.9375rem;
                    cursor:pointer;
                ">
                    J'ai compris
                </button>
            </div>
        `;
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        document.body.appendChild(overlay);
        
        // Ajouter l'animation
        if (!document.getElementById('pwa-ios-styles')) {
            const styles = document.createElement('style');
            styles.id = 'pwa-ios-styles';
            styles.textContent = `
                @keyframes pwaFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // ═══════════════════════════════════════════
    // NOTIFICATION DE SUCCÈS
    // ═══════════════════════════════════════════
    function showInstallSuccess() {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: #22C55E;
            color: #FFFFFF;
            padding: 14px 24px;
            border-radius: 12px;
            font-family: 'Inter', sans-serif;
            font-size: 0.875rem;
            font-weight: 600;
            z-index: 10002;
            box-shadow: 0 8px 32px rgba(34, 197, 94, 0.4);
            animation: pwaSlideUp 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        toast.innerHTML = '✅ Application installée avec succès !';
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ═══════════════════════════════════════════
    // VÉRIFIER SI ON DOIT AFFICHER LE BOUTON
    // ═══════════════════════════════════════════
    function shouldShowButton() {
        // Ne pas afficher si déjà installé
        if (isInstalled) return false;
        
        // Ne pas afficher si l'utilisateur a fermé récemment (3 jours)
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const threeDays = 3 * 24 * 60 * 60 * 1000;
            if (Date.now() - parseInt(dismissed) < threeDays) {
                return false;
            }
        }
        
        // Ne pas afficher sur les pages d'administration
        if (window.location.pathname.includes('/admin/')) return false;
        if (window.location.pathname.includes('/dashboard/')) return false;
        
        return true;
    }

    // ═══════════════════════════════════════════
    // INITIALISATION
    // ═══════════════════════════════════════════
    function init() {
        // Vérifier si déjà installé
        isInstalled = checkIfInstalled() || localStorage.getItem('pwa-installed') === 'true';
        
        if (isInstalled) {
            console.log('📱 PWA déjà installée, bouton masqué');
            return;
        }
        
        // Créer le bouton
        createInstallButton();
        
        // Écouter l'événement beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            // Empêcher le prompt automatique
            e.preventDefault();
            // Sauvegarder l'événement pour plus tard
            deferredPrompt = e;
            
            console.log('🎯 beforeinstallprompt déclenché');
            
            // Afficher le bouton si les conditions sont remplies
            if (shouldShowButton()) {
                // Petit délai pour éviter d'afficher trop tôt
                setTimeout(() => {
                    showInstallButton();
                }, 2000);
            }
        });
        
        // Écouter l'événement d'installation réussie
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installée avec succès !');
            isInstalled = true;
            deferredPrompt = null;
            hideInstallButton();
            localStorage.setItem('pwa-installed', 'true');
        });
        
        // Pour iOS : afficher après un délai si pas de beforeinstallprompt
        setTimeout(() => {
            if (!deferredPrompt && shouldShowButton() && !isInstalled) {
                // Sur iOS, on affiche le bouton avec les instructions
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if (isIOS && !navigator.standalone) {
                    createInstallButton();
                    setTimeout(() => showInstallButton(), 1500);
                }
            }
        }, 3000);
        
        console.log('📱 PWA Install initialisé');
    }

    // ═══════════════════════════════════════════
    // EXPOSER LES FONCTIONS GLOBALEMENT
    // ═══════════════════════════════════════════
    window.pwaInstall = {
        show: showInstallButton,
        hide: hideInstallButton,
        install: installPWA,
        isInstalled: () => isInstalled,
        showIOSGuide: showIOSInstructions
    };

    // ═══════════════════════════════════════════
    // DÉMARRER
    // ═══════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();