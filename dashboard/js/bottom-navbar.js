// ═══════════════════════════════════════════════════════════════
// BOTTOM NAVBAR CONTROLLER
// Gère la navigation mobile en bas de l'écran
// ═══════════════════════════════════════════════════════════════

(function() {
    'use strict';

    // ═══ CONFIGURATION ═══
    const BOTTOM_NAV_CONFIG = {
        // ID du conteneur de la bottom navbar
        containerId: 'bottomNavbar',
        
        // Configuration des liens de navigation
        navItems: [
            {
                id: 'nav-overview',
                href: '/dashboard/index.html',
                icon: 'layout-dashboard',
                label: 'Accueil',
                badgeId: null
            },
            {
                id: 'nav-services',
                href: '/dashboard/services.html',
                icon: 'briefcase',
                label: 'Services',
                badgeId: 'serviceBadge'
            },
            {
                id: 'nav-orders',
                href: '/dashboard/orders.html',
                icon: 'shopping-bag',
                label: 'Commandes',
                badgeId: 'orderBadge'
            },
            {
                id: 'nav-pricing',
                href: '/dashboard/pricing.html',
                icon: 'tags',
                label: 'Tarifs',
                badgeId: null
            },
            {
                id: 'nav-more',
                href: '#more-menu',
                icon: 'more-horizontal',
                label: 'Plus',
                badgeId: null,
                isMore: true
            }
        ],
        
        // Breakpoint mobile
        mobileBreakpoint: 1023
    };

    // ═══ STATE ═══
    let state = {
        bottomNavbar: null,
        isMobile: false,
        currentPath: window.location.pathname,
        moreMenuOpen: false
    };

    // ═══ DETECT MOBILE ═══
    function isMobileDevice() {
        return window.innerWidth <= BOTTOM_NAV_CONFIG.mobileBreakpoint;
    }

    // ═══ CREATE BOTTOM NAVBAR ═══
    function createBottomNavbar() {
        // Vérifier si elle existe déjà
        if (document.getElementById(BOTTOM_NAV_CONFIG.containerId)) {
            return document.getElementById(BOTTOM_NAV_CONFIG.containerId);
        }

        const navbar = document.createElement('nav');
        navbar.id = BOTTOM_NAV_CONFIG.containerId;
        navbar.className = 'bottom-navbar';
        navbar.setAttribute('aria-label', 'Navigation principale');
        navbar.setAttribute('role', 'navigation');

        const navList = document.createElement('div');
        navList.className = 'bottom-nav-list';

        BOTTOM_NAV_CONFIG.navItems.forEach(function(item) {
            const link = createNavLink(item);
            navList.appendChild(link);
        });

        navbar.appendChild(navList);
        document.body.appendChild(navbar);

        return navbar;
    }

    // ═══ CREATE NAV LINK ═══
    function createNavLink(item) {
        const linkContainer = document.createElement('div');
        linkContainer.className = 'bottom-nav-item';

        const link = document.createElement('a');
        link.href = item.href;
        link.className = 'bottom-nav-link';
        link.setAttribute('data-nav-id', item.id);
        link.setAttribute('aria-label', item.label);

        // Icône
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', item.icon);
        link.appendChild(icon);

        // Label
        const label = document.createElement('span');
        label.textContent = item.label;
        link.appendChild(label);

        // Badge (si configuré)
        if (item.badgeId) {
            const badge = document.createElement('span');
            badge.className = 'bottom-nav-badge';
            badge.id = 'bottom-' + item.badgeId;
            badge.textContent = '0';
            badge.style.display = 'none';
            link.appendChild(badge);
        }

        // Gestionnaire de clic pour "Plus"
        if (item.isMore) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                toggleMoreMenu(link);
            });
        } else {
            link.addEventListener('click', function(e) {
                // Fermer le menu "Plus" si ouvert
                if (state.moreMenuOpen) {
                    closeMoreMenu();
                }
                // Navigation normale
                setActiveLink(item.id);
            });
        }

        linkContainer.appendChild(link);
        return linkContainer;
    }

    // ═══ SET ACTIVE LINK ═══
    function setActiveLink(activeId) {
        const links = document.querySelectorAll('.bottom-nav-link');
        links.forEach(function(link) {
            const navId = link.getAttribute('data-nav-id');
            if (navId === activeId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // ═══ DETECT CURRENT PAGE ═══
    function detectCurrentPage() {
        const path = window.location.pathname;
        
        // Mapper les chemins aux IDs de navigation
        const pathMap = {
            'index': 'nav-overview',
            'services': 'nav-services',
            'orders': 'nav-orders',
            'pricing': 'nav-pricing',
            'portfolio': 'nav-more',
            'activities': 'nav-more',
            'profile': 'nav-more',
            'analytics': 'nav-more'
        };

        for (const [key, navId] of Object.entries(pathMap)) {
            if (path.includes(key)) {
                setActiveLink(navId);
                return;
            }
        }
        
        // Par défaut
        setActiveLink('nav-overview');
    }

    // ═══ MORE MENU ═══
    function toggleMoreMenu(triggerLink) {
        if (state.moreMenuOpen) {
            closeMoreMenu();
            return;
        }
        openMoreMenu(triggerLink);
    }

    function openMoreMenu(triggerLink) {
        // Supprimer l'ancien menu
        closeMoreMenu();

        const moreItems = [
            { href: '/dashboard/portfolio.html', icon: 'image', label: 'Portfolio' },
            { href: '/dashboard/activities.html', icon: 'award', label: 'Activités' },
            { href: '/dashboard/profile.html', icon: 'user-circle', label: 'Profil' },
            { href: '/dashboard/analytics.html', icon: 'bar-chart-3', label: 'Statistiques' }
        ];

        const menu = document.createElement('div');
        menu.className = 'more-menu-dropdown';
        menu.id = 'moreMenuDropdown';
        menu.style.cssText = `
            position: fixed;
            bottom: calc(80px + env(safe-area-inset-bottom));
            right: 16px;
            background: #FFFFFF;
            border: 1px solid #F3F4F6;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 8px;
            z-index: 160;
            min-width: 180px;
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        moreItems.forEach(function(item) {
            const link = document.createElement('a');
            link.href = item.href;
            link.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                text-decoration: none;
                color: #111827;
                font-size: 0.875rem;
                font-weight: 500;
                font-family: 'Inter', sans-serif;
                border-radius: 12px;
                transition: background 0.2s;
            `;
            link.innerHTML = `
                <i data-lucide="${item.icon}" style="width:1.25rem;height:1.25rem;color:#6B7280"></i>
                ${item.label}
            `;
            
            link.addEventListener('click', function() {
                closeMoreMenu();
            });
            
            link.addEventListener('mouseenter', function() {
                this.style.background = '#F9FAFB';
            });
            link.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
            });

            menu.appendChild(link);
        });

        document.body.appendChild(menu);
        
        // Rafraîchir les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        state.moreMenuOpen = true;
        
        // Fermer au clic extérieur
        setTimeout(function() {
            document.addEventListener('click', closeMoreMenuOnClickOutside);
        }, 0);
    }

    function closeMoreMenu() {
        const menu = document.getElementById('moreMenuDropdown');
        if (menu) {
            menu.remove();
        }
        state.moreMenuOpen = false;
        document.removeEventListener('click', closeMoreMenuOnClickOutside);
    }

    function closeMoreMenuOnClickOutside(e) {
        const menu = document.getElementById('moreMenuDropdown');
        if (menu && !menu.contains(e.target)) {
            closeMoreMenu();
        }
    }

    // ═══ UPDATE BADGES ═══
    function updateBadges() {
        // Synchroniser les badges de la sidebar avec la bottom navbar
        const badgeMap = {
            'serviceBadge': 'bottom-serviceBadge',
            'orderBadge': 'bottom-orderBadge'
        };

        for (const [sidebarBadgeId, bottomBadgeId] of Object.entries(badgeMap)) {
            const sidebarBadge = document.getElementById(sidebarBadgeId);
            const bottomBadge = document.getElementById(bottomBadgeId);
            
            if (sidebarBadge && bottomBadge) {
                const count = sidebarBadge.textContent;
                bottomBadge.textContent = count;
                bottomBadge.style.display = parseInt(count) > 0 ? 'inline' : 'none';
            }
        }
    }

    // ═══ INITIALIZATION ═══
    function init() {
        state.isMobile = isMobileDevice();
        
        if (state.isMobile) {
            state.bottomNavbar = createBottomNavbar();
            detectCurrentPage();
            updateBadges();
            
            // Rafraîchir les icônes
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Observer les changements de badges
            const badgeObserver = new MutationObserver(function() {
                updateBadges();
            });
            
            ['serviceBadge', 'orderBadge'].forEach(function(id) {
                const el = document.getElementById(id);
                if (el) {
                    badgeObserver.observe(el, { characterData: true, subtree: true });
                }
            });
        }

        console.log('📱 Bottom navbar ' + (state.isMobile ? 'activée' : 'désactivée (desktop)'));
    }

    // ═══ RESIZE HANDLER ═══
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            const wasMobile = state.isMobile;
            state.isMobile = isMobileDevice();
            
            if (!wasMobile && state.isMobile) {
                // Passage en mobile
                state.bottomNavbar = createBottomNavbar();
                detectCurrentPage();
                updateBadges();
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else if (wasMobile && !state.isMobile) {
                // Passage en desktop
                const navbar = document.getElementById(BOTTOM_NAV_CONFIG.containerId);
                if (navbar) navbar.remove();
                closeMoreMenu();
            }
        }, 250);
    });

    // ═══ EXPORT ═══
    window.bottomNavbar = {
        setActive: setActiveLink,
        updateBadges: updateBadges,
        refresh: function() {
            if (state.isMobile && typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    };

    // ═══ START ═══
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// ═══════════════════════════════════════════════════════════════
// Animation slideUp pour le menu "Plus"
// ═══════════════════════════════════════════════════════════════
const moreMenuStyle = document.createElement('style');
moreMenuStyle.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(moreMenuStyle);