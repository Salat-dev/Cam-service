// ═══════════════════════════════════════════
// GLOBAL.JS — CamServices
// Utilitaires globaux pour toutes les pages
// ═══════════════════════════════════════════

(function() {
    'use strict';

    // ═══════════════ CONFIG ═══════════════
    const CONFIG = {
        supabaseUrl: 'https://cwubxwbzzuigctvgdygv.supabase.co',
        supabaseAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk',
        cartKey: 'camservices_cart',
        userKey: 'camservices_user',
        emailKey: 'rememberedEmail'
    };

    // ═══════════════ INIT SUPABASE ═══════════════
    window.supabaseClient = window.supabase?.createClient 
        ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnon)
        : null;

    // ═══════════════ DÉTECTION APPAREIL ═══════════════
    const Device = {
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: function() { return this.width <= 768; },
        isTablet: function() { return this.width > 768 && this.width <= 1024; },
        isDesktop: function() { return this.width > 1024; },
        isSmallMobile: function() { return this.width <= 360; },
        isTouch: function() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; },
        isIOS: function() { return /iPhone|iPad|iPod/.test(navigator.userAgent); },
        isAndroid: function() { return /Android/.test(navigator.userAgent); },
        orientation: function() { return this.width > this.height ? 'landscape' : 'portrait'; }
    };

    // ═══════════════ STORAGE ═══════════════
    window.Storage = {
        get: function(key, defaultValue) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch(e) {
                return defaultValue;
            }
        },
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch(e) {
                console.warn('Storage full:', e);
            }
        },
        remove: function(key) {
            localStorage.removeItem(key);
        },
        getCart: function() {
            return this.get(CONFIG.cartKey, []);
        },
        setCart: function(cart) {
            this.set(CONFIG.cartKey, cart);
        },
        clearCart: function() {
            this.remove(CONFIG.cartKey);
        },
        addToCart: function(item) {
            const cart = this.getCart();
            const exists = cart.find(i => i.serviceId === item.serviceId);
            if (!exists) {
                cart.push({ ...item, addedAt: new Date().toISOString() });
                this.setCart(cart);
                return true;
            }
            return false;
        },
        removeFromCart: function(serviceId) {
            const cart = this.getCart().filter(i => i.serviceId !== serviceId);
            this.setCart(cart);
        },
        getCartCount: function() {
            return this.getCart().length;
        }
    };

    // ═══════════════ FORMATAGE ═══════════════
    window.Format = {
        price: function(price, showSymbol) {
            if (price === null || price === undefined) return '—';
            return new Intl.NumberFormat('fr-FR', {
                style: showSymbol !== false ? 'currency' : 'decimal',
                currency: 'XAF',
                maximumFractionDigits: 0
            }).format(price);
        },
        date: function(date, format) {
            if (!date) return '—';
            const d = new Date(date);
            switch(format) {
                case 'short':
                    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                case 'time':
                    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                case 'datetime':
                    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                case 'relative':
                    return Format.timeAgo(date);
                default:
                    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            }
        },
        timeAgo: function(dateString) {
            const now = new Date();
            const date = new Date(dateString);
            const diff = Math.floor((now - date) / 1000);
            if (diff < 60) return "À l'instant";
            if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
            if (diff < 86400) return `Il y a ${Math.floor(diff/3600)} h`;
            if (diff < 2592000) return `Il y a ${Math.floor(diff/86400)} j`;
            if (diff < 31536000) return `Il y a ${Math.floor(diff/2592000)} mois`;
            return date.toLocaleDateString('fr-FR');
        },
        phone: function(phone) {
            if (!phone) return '';
            const cleaned = phone.replace(/[^\d+]/g, '');
            if (cleaned.length >= 9) {
                return cleaned.replace(/(\+?\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
            }
            return cleaned;
        },
        status: function(status) {
            const map = {
                pending: 'En attente', confirmed: 'Confirmée', in_progress: 'En cours',
                completed: 'Terminée', cancelled: 'Annulée', deleted: 'Supprimée',
                active: 'Actif', inactive: 'Inactif'
            };
            return map[status] || status;
        },
        pricingType: function(type) {
            const map = {
                fixed: 'Prix fixe', hourly: 'Taux horaire', daily: 'Journalier',
                project: 'Par projet', half_day: 'Demi-journée', full_day: 'Journée'
            };
            return map[type] || type;
        },
        initials: function(name, count) {
            if (!name) return '?';
            count = count || 2;
            return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, count).join('').toUpperCase();
        },
        truncate: function(text, maxLength) {
            if (!text || text.length <= (maxLength || 100)) return text || '';
            return text.substring(0, maxLength).trim() + '...';
        },
        slug: function(text) {
            return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        },
        escape: function(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    };

    // ═══════════════ NOTIFICATIONS ═══════════════
    window.Toast = {
        show: function(message, type) {
            type = type || 'info';
            const existing = document.querySelector('.toast');
            if (existing) existing.remove();

            const icons = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i data-lucide="${icons[type]}" style="width:1.2rem;height:1.2rem;flex-shrink:0"></i> <span>${message}</span>`;
            document.body.appendChild(toast);

            if (window.lucide) lucide.createIcons({ elements: [toast] });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        },
        success: function(msg) { this.show(msg, 'success'); },
        error: function(msg) { this.show(msg, 'error'); },
        info: function(msg) { this.show(msg, 'info'); },
        warning: function(msg) { this.show(msg, 'warning'); }
    };

    // ═══════════════ SCROLL REVEAL ═══════════════
    function initScrollReveal() {
        const elements = document.querySelectorAll('.reveal');
        if (elements.length === 0 || !window.IntersectionObserver) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        elements.forEach(el => observer.observe(el));
    }

    // ═══════════════ MOBILE MENU ═══════════════
    function initMobileMenu() {
        const toggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const navLinks = document.getElementById('navLinks');

        if (toggle && sidebar) {
            toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }

        if (toggle && navLinks) {
            toggle.addEventListener('click', () => navLinks.classList.toggle('show'));
            document.querySelectorAll('#navLinks a').forEach(link => {
                link.addEventListener('click', () => navLinks.classList.remove('show'));
            });
        }
    }

    // ═══════════════ NAVBAR SCROLL ═══════════════
    function initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 30);
        });
    }

    // ═══════════════ CART COUNT UPDATE ═══════════════
    window.updateAllCartCounts = function() {
        const count = Storage.getCartCount();
        document.querySelectorAll('.cart-count, #cartCount, #cartCountNav').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-flex' : 'none';
        });
    };

    // ═══════════════ SESSION CHECK ═══════════════
    window.checkSession = async function() {
        if (!window.supabaseClient) return null;
        try {
            const { data } = await window.supabaseClient.auth.getSession();
            return data.session;
        } catch(e) {
            return null;
        }
    };

    window.getCurrentUser = async function() {
        if (!window.supabaseClient) return null;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            return user;
        } catch(e) {
            return null;
        }
    };

    // ═══════════════ RESPONSIVE HELPERS ═══════════════
    window.onResize = function(callback) {
        let timeout;
        window.addEventListener('resize', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                Device.width = window.innerWidth;
                Device.height = window.innerHeight;
                callback(Device);
            }, 250);
        });
    };

    // ═══════════════ KEYBOARD SHORTCUTS ═══════════════
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            
            // Ctrl+K ou / pour focus search
            if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
                e.preventDefault();
                const searchInput = document.querySelector('#searchInput, #heroSearchInput, .search-input');
                if (searchInput) searchInput.focus();
            }
            
            // Escape pour fermer modals
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    const closeBtn = modal.querySelector('.modal-close');
                    if (closeBtn) closeBtn.click();
                }
            }
        });
    }

    // ═══════════════ IMAGE FALLBACK ═══════════════
    function initImageFallback() {
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', function() {
                this.style.display = 'none';
                const parent = this.parentElement;
                if (parent && !parent.querySelector('.img-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'img-fallback';
                    fallback.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--cream);color:var(--faint);font-size:2rem;';
                    fallback.innerHTML = '<i data-lucide="image"></i>';
                    parent.appendChild(fallback);
                    if (window.lucide) lucide.createIcons();
                }
            });
        });
    }

    // ═══════════════ SMOOTH SCROLL FOR ANCHORS ═══════════════
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ═══════════════ ACTIVE NAV LINK ═══════════════
    window.setActiveNav = function(pageId) {
        document.querySelectorAll('.nav-links a, .sidebar-nav a').forEach(a => a.classList.remove('active'));
        const activeLink = document.querySelector(`[data-nav="${pageId}"], #nav-${pageId}`);
        if (activeLink) activeLink.classList.add('active');
    };

    // ═══════════════ INIT ═══════════════
    function init() {
        initScrollReveal();
        initMobileMenu();
        initNavbarScroll();
        initKeyboardShortcuts();
        initImageFallback();
        initSmoothScroll();
        updateAllCartCounts();

        // Marquer les liens actifs automatiquement
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-links a, .sidebar-nav a').forEach(a => {
            const href = a.getAttribute('href');
            if (href && currentPath.includes(href.replace(/^.*\//, ''))) {
                a.classList.add('active');
            }
        });

        // Log device info
        console.log(`📱 Device: ${Device.width}x${Device.height} | ${Device.isMobile() ? 'Mobile' : Device.isTablet() ? 'Tablet' : 'Desktop'} | ${Device.isTouch() ? 'Touch' : 'Mouse'}`);
    }

    // ═══════════════ START ═══════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();