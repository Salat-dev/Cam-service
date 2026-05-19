// ═══════════════════════════════════════════════════════════════
// ULTRA RESPONSIVE JS - Mobile First
// À inclure dans toutes les pages du dashboard
// ═══════════════════════════════════════════════════════════════

(function() {
    'use strict';

    // ═══ CONFIGURATION ═══
    const CONFIG = {
        mobileBreakpoint: 1023,
        tabletBreakpoint: 767,
        smallMobileBreakpoint: 424,
        sidebarWidth: 260,
        resizeDebounce: 150
    };

    // ═══ STATE ═══
    let state = {
        isMobile: false,
        isTablet: false,
        isSmallMobile: false,
        sidebarOpen: false,
        currentOrientation: 'portrait',
        isTouchDevice: false
    };

    // ═══ DETECTION ═══
    function detectDevice() {
        state.isTouchDevice = ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0) || 
                              (navigator.msMaxTouchPoints > 0);
        state.isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
        state.isTablet = window.innerWidth <= CONFIG.tabletBreakpoint;
        state.isSmallMobile = window.innerWidth <= CONFIG.smallMobileBreakpoint;
        state.currentOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    // ═══ SIDEBAR MANAGEMENT ═══
    function createSidebarOverlay() {
        if (document.getElementById('sidebarOverlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.addEventListener('click', closeSidebar);
        document.body.appendChild(overlay);
    }

    function openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar) return;
        
        sidebar.classList.add('open');
        sidebar.setAttribute('aria-hidden', 'false');
        if (overlay) {
            overlay.classList.add('show');
            overlay.setAttribute('aria-hidden', 'false');
        }
        state.sidebarOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Focus trap
        const firstLink = sidebar.querySelector('a');
        if (firstLink) setTimeout(() => firstLink.focus(), 100);
    }

    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar) return;
        
        sidebar.classList.remove('open');
        sidebar.setAttribute('aria-hidden', 'true');
        if (overlay) {
            overlay.classList.remove('show');
            overlay.setAttribute('aria-hidden', 'true');
        }
        state.sidebarOpen = false;
        document.body.style.overflow = '';
    }

    function toggleSidebar() {
        if (state.sidebarOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    // Exposer globalement
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;
    window.openSidebar = openSidebar;

    // ═══ MENU TOGGLE SETUP ═══
    function setupMenuToggle() {
        const toggle = document.getElementById('menuToggle') || 
                      document.querySelector('.menu-toggle');
        if (!toggle) return;
        
        // Retirer les anciens listeners
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSidebar();
        });
        
        // Mise à jour de l'icône
        updateMenuIcon();
    }

    function updateMenuIcon() {
        const toggle = document.getElementById('menuToggle') || 
                      document.querySelector('.menu-toggle');
        if (!toggle) return;
        
        if (state.sidebarOpen) {
            toggle.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Fermer le menu');
        } else {
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Ouvrir le menu');
        }
    }

    // ═══ NAVBAR SCROLL ═══
    function setupNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        let lastScroll = 0;
        let scrollTimeout;
        
        window.addEventListener('scroll', function() {
            if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
            
            scrollTimeout = requestAnimationFrame(function() {
                const currentScroll = window.pageYOffset;
                
                if (currentScroll > 20) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                
                // Masquer/afficher la navbar au scroll sur mobile
                if (state.isMobile && currentScroll > 100) {
                    if (currentScroll > lastScroll + 10) {
                        navbar.style.transform = 'translateY(-100%)';
                    } else if (currentScroll < lastScroll - 10) {
                        navbar.style.transform = 'translateY(0)';
                    }
                } else {
                    navbar.style.transform = '';
                }
                
                lastScroll = currentScroll;
            });
        }, { passive: true });
    }

    // ═══ TABLE RESPONSIVE ═══
    function setupResponsiveTables() {
        document.querySelectorAll('table').forEach(function(table) {
            // Ajouter data-label aux cellules pour le mode carte mobile
            if (state.isTablet) {
                const headers = [];
                table.querySelectorAll('th').forEach(function(th) {
                    headers.push(th.textContent.trim());
                });
                
                table.querySelectorAll('tbody tr').forEach(function(tr) {
                    tr.querySelectorAll('td').forEach(function(td, index) {
                        if (headers[index]) {
                            td.setAttribute('data-label', headers[index]);
                        }
                    });
                });
            }
        });
    }

    // ═══ TOUCH OPTIMIZATIONS ═══
    function setupTouchOptimizations() {
        if (!state.isTouchDevice) return;
        
        // Double-tap zoom prevention sur les boutons
        document.querySelectorAll('.btn, .btn-icon, .tab, button').forEach(function(el) {
            el.addEventListener('touchstart', function(e) {
                // Empêcher le zoom sur double-tap
                if (e.touches.length > 1) return;
                e.preventDefault();
                this.click();
            }, { passive: false });
        });
        
        // Scroll horizontal fluide pour les tabs et tableaux
        document.querySelectorAll('.tabs, .table-wrapper').forEach(function(el) {
            el.style.webkitOverflowScrolling = 'touch';
            el.style.scrollBehavior = 'smooth';
        });
    }

    // ═══ MODAL MOBILE ═══
    function setupModals() {
        // Observer les modales pour ajuster le comportement sur mobile
        const modalObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.classList && node.classList.contains('modal-overlay')) {
                        setupModalForMobile(node);
                    }
                });
            });
        });
        
        modalObserver.observe(document.body, { childList: true, subtree: true });
    }

    function setupModalForMobile(overlay) {
        if (!state.isTablet) return;
        
        const modal = overlay.querySelector('.modal, .modal-content');
        if (!modal) return;
        
        // Ajuster le style pour mobile
        modal.style.borderRadius = '20px 20px 0 0';
        modal.style.maxWidth = '100%';
        
        // Fermer au swipe down
        let startY = 0;
        modal.addEventListener('touchstart', function(e) {
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        modal.addEventListener('touchmove', function(e) {
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 100 && modal.scrollTop <= 0) {
                overlay.remove();
            }
        }, { passive: true });
    }

    // ═══ RESPONSIVE CHARTS ═══
    function setupResponsiveCharts() {
        // Redimensionner les graphiques
        const chartObserver = new ResizeObserver(function(entries) {
            entries.forEach(function(entry) {
                const chart = entry.target;
                if (chart.querySelector('.bar-chart')) {
                    updateBarChartSize(chart);
                }
                if (chart.querySelector('.donut-chart')) {
                    updateDonutChartSize(chart);
                }
            });
        });
        
        document.querySelectorAll('#revenueChart, #ordersChart, .chart-container').forEach(function(el) {
            chartObserver.observe(el);
        });
    }

    function updateBarChartSize(container) {
        const width = container.clientWidth;
        const bars = container.querySelectorAll('.bar-item');
        const gap = width > 400 ? 12 : 6;
        bars.forEach(function(bar) {
            bar.style.gap = gap + 'px';
        });
    }

    function updateDonutChartSize(container) {
        const donut = container.querySelector('.donut-chart');
        if (!donut) return;
        const size = Math.min(container.clientWidth * 0.4, 140);
        donut.style.width = size + 'px';
        donut.style.height = size + 'px';
    }

    // ═══ LAZY LOADING IMAGES ═══
    function setupLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) return;
        
        // Fallback pour navigateurs sans lazy loading natif
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(function(img) {
            observer.observe(img);
        });
    }

    // ═══ PERFORMANCE MONITORING ═══
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ═══ RESIZE HANDLER ═══
    const handleResize = debounce(function() {
        const wasMobile = state.isMobile;
        detectDevice();
        
        // Si on passe de desktop à mobile
        if (!wasMobile && state.isMobile) {
            closeSidebar();
            setupResponsiveTables();
        }
        
        // Si on passe de mobile à desktop
        if (wasMobile && !state.isMobile) {
            closeSidebar();
            document.body.style.overflow = '';
        }
        
        updateMenuIcon();
        setupResponsiveTables();
    }, CONFIG.resizeDebounce);

    // ═══ KEYBOARD NAVIGATION ═══
    function setupKeyboardNav() {
        document.addEventListener('keydown', function(e) {
            // Escape pour fermer la sidebar
            if (e.key === 'Escape' && state.sidebarOpen) {
                closeSidebar();
            }
            
            // Ctrl+K ou / pour focus la recherche
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.target.closest('input, textarea'))) {
                e.preventDefault();
                const searchInput = document.querySelector('#searchInput, input[type="search"]');
                if (searchInput) searchInput.focus();
            }
        });
    }

    // ═══ INITIALIZATION ═══
    function init() {
        detectDevice();
        createSidebarOverlay();
        setupMenuToggle();
        setupNavbarScroll();
        setupResponsiveTables();
        setupTouchOptimizations();
        setupModals();
        setupResponsiveCharts();
        setupLazyLoading();
        setupKeyboardNav();
        
        // Resize listener
        window.addEventListener('resize', handleResize, { passive: true });
        
        // Orientation change
        window.addEventListener('orientationchange', function() {
            setTimeout(handleResize, 200);
        }, { passive: true });
        
        // Fermer la sidebar au clic sur les liens (mobile)
        if (state.isMobile) {
            document.querySelectorAll('.sidebar-nav a, .sidebar-footer a').forEach(function(link) {
                link.addEventListener('click', function() {
                    setTimeout(closeSidebar, 150);
                });
            });
        }
        
        // Exposer l'état
        window.deviceState = state;
        
        console.log('📱 Responsive dashboard initialized', {
            isMobile: state.isMobile,
            isTablet: state.isTablet,
            isSmallMobile: state.isSmallMobile,
            isTouchDevice: state.isTouchDevice,
            width: window.innerWidth,
            orientation: state.currentOrientation
        });
    }

    // ═══ START ═══
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS (ajoutées au global scope)
// ═══════════════════════════════════════════════════════════════

// Vérifier si on est sur mobile
window.isMobileDevice = function() {
    return window.innerWidth <= 1023;
};

// Vérifier si on est sur tablette
window.isTabletDevice = function() {
    return window.innerWidth <= 767;
};

// Vérifier si c'est un petit mobile
window.isSmallMobileDevice = function() {
    return window.innerWidth <= 424;
};

// Vérifier si c'est un écran tactile
window.isTouchDevice = function() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

// Obtenir la taille actuelle de l'écran
window.getScreenSize = function() {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        category: window.innerWidth <= 374 ? 'xs' :
                  window.innerWidth <= 424 ? 'sm' :
                  window.innerWidth <= 767 ? 'md' :
                  window.innerWidth <= 1023 ? 'lg' : 'xl'
    };
};