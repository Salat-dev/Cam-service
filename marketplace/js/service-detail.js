const SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

var _currentService = null;
var _currentProvider = null;
var _relatedServices = [];
var _providerStats = null;
var _providerPricing = [];
var _providerPortfolio = [];
var _providerActivities = [];
var _isUserLoggedIn = false;

document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    checkAuthStatus();
    loadServiceDetail();
});

// ═══ AUTH ═══
async function checkAuthStatus() {
    var { data } = await sb.auth.getSession();
    _isUserLoggedIn = !!(data.session);
    var btn = document.getElementById('navLogin');
    if (_isUserLoggedIn && btn) {
        btn.textContent = 'Mon compte';
        btn.href = 'login-client.html';
    }
}

// ═══ AUTH ═══
async function requireAuth(actionLabel) {
    var { data } = await sb.auth.getSession();
    if (data.session) { _isUserLoggedIn = true; return true; }
    _isUserLoggedIn = false;
    
    // ✅ Rediriger vers la page de connexion au lieu d'ouvrir un modal
    localStorage.setItem('warap_redirect_url', window.location.href);
    window.location.href = 'required-login.html';
    return false;
}

function showAuthModal(actionLabel) {
    var existing = document.getElementById('authModalOverlay');
    if (existing) existing.remove();

    localStorage.setItem('warap_redirect_url', window.location.href);

    var overlay = document.createElement('div');
    overlay.id = 'authModalOverlay';
    overlay.className = 'auth-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML =
        '<div class="auth-modal">'
        + '<div class="auth-modal-icon"><i data-lucide="lock"></i></div>'
        + '<h3>Connexion requise</h3>'
        + '<p>Vous devez vous connecter pour ' + (actionLabel || 'continuer') + '. Connectez-vous ou créez un compte gratuitement en quelques secondes.</p>'
        + '<div class="auth-modal-actions">'
        + '<a href="login-client.html" class="btn btn-dark btn-block"><i data-lucide="log-in"></i> Se connecter</a>'
        + '<a href="signup-client.html" class="btn btn-outline btn-block"><i data-lucide="user-plus"></i> Créer un compte</a>'
        + '<button onclick="document.getElementById(\'authModalOverlay\').remove()" style="background:none;border:none;color:var(--text-muted);font-size:0.8125rem;margin-top:6px;cursor:pointer;padding:6px;text-decoration:underline">Plus tard</button>'
        + '</div>'
        + '</div>';

    document.body.appendChild(overlay);
    lucide.createIcons();
}

function getServiceId() {
    return new URLSearchParams(window.location.search).get('id');
}

async function loadServiceDetail() {
    var serviceId = getServiceId();
    var container = document.getElementById('service-detail');

    if (!serviceId) {
        container.innerHTML = renderEmptyState('Aucun service spécifié.', 'search-x');
        return;
    }

    container.innerHTML = renderLoading();

    try {
        var { data: service, error } = await sb
            .from('services')
            .select('*, provider:user_id(id, full_name, phone, email, city, neighborhood, profile_photo_url, is_verified, bio, domain_expertise, education, side_activities, employment_status, created_at)')
            .eq('id', serviceId)
            .single();

        if (error) throw error;
        if (!service) { container.innerHTML = renderEmptyState('Service introuvable.', 'package-x'); return; }

        _currentService = service;
        _currentProvider = service.provider || {};

        var providerId = _currentProvider.id;

        var [relRes, statsRes, pricingRes, portfolioRes, activitiesRes] = await Promise.all([
            sb.from('services')
              .select('*, provider:user_id(id, full_name, city, profile_photo_url, is_verified)')
              .eq('category', service.category).eq('is_active', true).neq('id', serviceId).limit(3),
            providerId ? sb.from('provider_stats').select('*').eq('provider_id', providerId).maybeSingle() : { data: null },
            providerId ? sb.from('pricing_grid').select('*').eq('user_id', providerId).eq('is_active', true).order('base_price') : { data: [] },
            providerId ? sb.from('portfolio_items').select('*').eq('user_id', providerId).order('is_featured', { ascending: false }).order('display_order').limit(9) : { data: [] },
            providerId ? sb.from('provider_activities').select('*').eq('user_id', providerId).order('date_start', { ascending: false, nullsFirst: false }).limit(5) : { data: [] }
        ]);

        _relatedServices = (relRes.data || []).filter(function(s) { return s.provider !== null; });
        _providerStats = statsRes.data || null;
        _providerPricing = pricingRes.data || [];
        _providerPortfolio = portfolioRes.data || [];
        _providerActivities = activitiesRes.data || [];

        recordProfileView();
        renderServiceDetail();
        showOnlinePopup();  // ← POPUP

    } catch (err) {
        console.error('Erreur chargement service:', err);
        container.innerHTML = renderEmptyState('Erreur : ' + err.message, 'alert-triangle');
    }
}

async function recordProfileView() {
    if (!_currentProvider.id) return;
    try {
        var { data: session } = await sb.auth.getSession();
        await sb.from('profile_views').insert({
            provider_id: _currentProvider.id,
            viewer_id: session && session.session ? session.session.user.id : null,
            user_agent: navigator.userAgent
        });
    } catch (err) { /* silencieux */ }
}

function renderServiceDetail() {
    var container = document.getElementById('service-detail');
    var s = _currentService;
    var p = _currentProvider;

    var phone = (p.phone || '').replace(/\s+/g, '').replace('+', '');
    var whatsappUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Bonjour, je suis intéressé par votre service "' + s.title + '" sur warap.');
    var initials = (p.full_name || '?').split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase();

    var html = '';

    // ═══ BREADCRUMB ═══
    html += '<div class="breadcrumb-bar">';
    html += '<div class="breadcrumb"><a href="landing.html">Accueil</a> <span>/</span> <a href="services.html">Services</a> <span>/</span> <span>' + escapeHtml(s.title) + '</span></div>';
    html += '</div>';

    // ═══ HERO ═══
    html += '<div class="service-hero">';
    html += '<div class="service-hero-content">';
    html += '<div class="category-badge">' + escapeHtml(s.category || 'Service') + '</div>';
    html += '<h1 class="service-title">' + escapeHtml(s.title) + '</h1>';
    html += '<div class="service-price">' + formatPrice(s.price) + ' <span class="price-type">' + formatPricingType(s.pricing_type) + '</span></div>';
    html += '<span class="service-status ' + (s.is_active ? 'status-active' : 'status-inactive') + '">' + (s.is_active ? '✓ Disponible' : '✕ Indisponible') + '</span>';
    html += '</div>';

    if (s.image_url) {
        html += '<div class="service-hero-image">';
        html += '<img src="' + escapeHtml(s.image_url) + '" alt="' + escapeHtml(s.title) + '" loading="lazy" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div style=display:flex;align-items:center;justify-content:center;height:100%;color:var(--border);font-size:3rem><i data-lucide=image></i></div>\'">';
        html += '</div>';
    }

    html += '</div>';

    // ═══ LAYOUT ═══
    html += '<div class="detail-layout">';
    html += '<div class="detail-main">';

    // ── Description ──
    html += '<div class="card">';
    html += '<h2 class="card-title"><i data-lucide="file-text"></i> Description</h2>';
    html += '<div class="description-text">' + escapeHtml(s.description || 'Aucune description fournie pour ce service.') + '</div>';
    html += '<div class="info-grid">';
    html += '<div><span class="info-item-label">Type de prix</span><span class="info-item-value">' + formatPricingType(s.pricing_type) + '</span></div>';
    if (s.duration_minutes) {
        html += '<div><span class="info-item-label">Durée estimée</span><span class="info-item-value">' + s.duration_minutes + ' Heures</span></div>';
    }
    html += '<div><span class="info-item-label">Statut</span><span class="info-item-value">' + (s.is_active ? 'Disponible' : 'Indisponible') + '</span></div>';
    html += '</div>';
    html += '</div>';

    // ── Disponibilités ──
    if (s.working_days && s.working_days.length > 0) {
        html += '<div class="card">';
        html += '<h2 class="card-title"><i data-lucide="calendar"></i> Disponibilités</h2>';
        html += '<div class="schedule-days">';
        var dayNames = { 'Lun':'Lundi', 'Mar':'Mardi', 'Mer':'Mercredi', 'Jeu':'Jeudi', 'Ven':'Vendredi', 'Sam':'Samedi', 'Dim':'Dimanche' };
        for (var d = 0; d < s.working_days.length; d++) {
            var day = s.working_days[d];
            html += '<span class="schedule-day"><i data-lucide="calendar-check"></i> ' + (dayNames[day] || day) + '</span>';
        }
        html += '</div>';

        if (s.time_start || s.time_end) {
            html += '<div class="schedule-hours">';
            html += '<i data-lucide="clock"></i>';
            html += '<span style="font-weight:600">Horaires :</span>';
            html += '<span>' + (s.time_start ? s.time_start.substring(0, 5) : '—') + '</span>';
            html += '<span style="color:var(--text-muted)">→</span>';
            html += '<span>' + (s.time_end ? s.time_end.substring(0, 5) : '—') + '</span>';
            html += '</div>';
        }
        html += '</div>';
    }

    // ── Prestataire ──
    html += '<div class="card">';
    html += '<h2 class="card-title"><i data-lucide="user-circle"></i> À propos du prestataire</h2>';
    html += '<div class="provider-profile">';
    // ✅ POINT VERT : position:relative sur le conteneur + span.online-dot
    html += '<div class="provider-avatar" style="position:relative">';
    if (p.profile_photo_url) {
        html += '<img src="' + p.profile_photo_url + '" alt="' + escapeHtml(p.full_name) + '">';
    } else {
        html += '<span class="provider-avatar-initials">' + initials + '</span>';
    }
    html += '<span class="online-dot"></span>';
    html += '</div>';
    html += '<div class="provider-info">';
    html += '<h3 class="provider-name">' + escapeHtml(p.full_name || 'Inconnu');
    if (p.is_verified) html += ' <span class="verified-badge"><i data-lucide="shield-check"></i> Vérifié</span>';
    html += '</h3>';
    if (p.city) html += '<p class="provider-location"><i data-lucide="map-pin"></i> ' + escapeHtml(p.city) + (p.neighborhood ? ', ' + escapeHtml(p.neighborhood) : '') + '</p>';
    if (p.bio) html += '<p class="provider-bio">' + escapeHtml(p.bio) + '</p>';

    var metaItems = [];
    if (p.education) metaItems.push('<span><i data-lucide="graduation-cap" style="width:0.75rem;height:0.75rem;color:var(--primary)"></i> ' + escapeHtml(p.education) + '</span>');
    if (p.employment_status) {
        var empMap = { employed:'Employé', unemployed:'Indépendant', self_employed:'Auto-entrepreneur', student:'Étudiant' };
        metaItems.push('<span><i data-lucide="briefcase" style="width:0.75rem;height:0.75rem"></i> ' + (empMap[p.employment_status] || p.employment_status) + '</span>');
    }
    if (p.side_activities) metaItems.push('<span><i data-lucide="activity" style="width:0.75rem;height:0.75rem"></i> ' + escapeHtml(p.side_activities) + '</span>');
    if (p.created_at) {
        var memberSince = new Date(p.created_at).toLocaleDateString('fr-FR', { month:'long', year:'numeric' });
        metaItems.push('<span><i data-lucide="calendar" style="width:0.75rem;height:0.75rem"></i> Membre depuis ' + memberSince + '</span>');
    }
    if (metaItems.length > 0) {
        html += '<div class="provider-meta">' + metaItems.join('') + '</div>';
    }

    if (p.domain_expertise && p.domain_expertise.length > 0) {
        html += '<div class="expertise-tags">';
        for (var i = 0; i < p.domain_expertise.length; i++) {
            html += '<span class="expertise-tag">' + escapeHtml(p.domain_expertise[i]) + '</span>';
        }
        html += '</div>';
    }
    html += '</div></div>';

    // ── Stats ──
    if (_providerStats) {
        var st = _providerStats;
        html += '<div class="stats-mini">';
        html += '<div class="stat-mini"><div class="stat-mini-value">' + (st.completed_orders || 0) + '</div><div class="stat-mini-label">Commandes</div></div>';
        html += '<div class="stat-mini"><div class="stat-mini-value">' + (st.average_rating ? st.average_rating.toFixed(1) : '—') + '</div><div class="stat-mini-label">Note</div></div>';
        html += '<div class="stat-mini"><div class="stat-mini-value">' + (st.total_reviews || 0) + '</div><div class="stat-mini-label">Avis</div></div>';
        html += '<div class="stat-mini"><div class="stat-mini-value">' + (st.response_rate ? Math.round(st.response_rate) + '%' : '—') + '</div><div class="stat-mini-label">Réponse</div></div>';
        html += '</div>';
    }
    html += '</div>';

    // ── Grille tarifaire ──
    html += '<div class="card">';
    html += '<h2 class="card-title"><i data-lucide="tags"></i> Grille tarifaire</h2>';
    if (_providerPricing.length === 0) {
        html += '<div class="empty-state"><i data-lucide="tags"></i>Aucun tarif publié pour l\'instant</div>';
    } else {
        html += '<div class="pricing-list">';
        for (var i = 0; i < _providerPricing.length; i++) {
            var pr = _providerPricing[i];
            html += '<div class="pricing-item">';
            html += '<div>';
            html += '<div class="pricing-item-name">' + escapeHtml(pr.name) + '</div>';
            if (pr.description) html += '<div class="pricing-item-desc">' + escapeHtml(pr.description).substring(0, 80) + '</div>';
            html += '<div class="pricing-item-meta">';
            html += '<span class="pricing-item-tag">' + formatPricingTypeDetail(pr.pricing_type) + '</span>';
            if (pr.duration_hours) html += '<span style="font-size:0.75rem;color:var(--text-muted)">' + pr.duration_hours + 'h</span>';
            if (pr.max_people) html += '<span style="font-size:0.75rem;color:var(--text-muted)">Max ' + pr.max_people + ' pers.</span>';
            html += '</div>';
            if (pr.includes && pr.includes.length > 0) {
                html += '<div class="pricing-includes">';
                for (var k = 0; k < Math.min(pr.includes.length, 3); k++) {
                    html += '<span class="pricing-include-tag">✓ ' + escapeHtml(pr.includes[k]) + '</span>';
                }
                if (pr.includes.length > 3) html += '<span style="font-size:0.6875rem;color:var(--text-muted)">+' + (pr.includes.length - 3) + '</span>';
                html += '</div>';
            }
            html += '</div>';
            html += '<div class="pricing-item-price">' + formatPrice(pr.base_price) + '</div>';
            html += '</div>';
        }
        html += '</div>';
    }
    html += '</div>';

    // ── Portfolio ──
    html += '<div class="card">';
    html += '<h2 class="card-title"><i data-lucide="image"></i> Portfolio / Réalisations</h2>';
    if (_providerPortfolio.length === 0) {
        html += '<div class="empty-state"><i data-lucide="camera"></i>Aucune réalisation publiée</div>';
    } else {
        html += '<div class="portfolio-grid">';
        for (var i = 0; i < _providerPortfolio.length; i++) {
            var po = _providerPortfolio[i];
            html += '<div class="portfolio-item" onclick="showPortfolioLightbox(' + i + ')">';
            html += '<img src="' + escapeHtml(po.media_url) + '" alt="' + escapeHtml(po.title) + '" loading="lazy" onerror="this.style.display=\'none\'">';
            if (po.is_featured) html += '<div class="portfolio-featured-dot"></div>';
            html += '</div>';
        }
        html += '</div>';
    }
    html += '</div>';

    // ── Activités ──
    html += '<div class="card">';
    html += '<h2 class="card-title"><i data-lucide="award"></i> Activités & Certifications</h2>';
    if (_providerActivities.length === 0) {
        html += '<div class="empty-state"><i data-lucide="award"></i>Aucune activité enregistrée</div>';
    } else {
        html += '<div class="activity-list">';
        for (var i = 0; i < _providerActivities.length; i++) {
            var ac = _providerActivities[i];
            var tc = getActivityTypeConfig(ac.activity_type);
            html += '<div class="activity-item">';
            html += '<div class="activity-icon" style="background:' + tc.bg + '"><i data-lucide="' + tc.icon + '" style="color:' + tc.color + '"></i></div>';
            html += '<div>';
            html += '<div class="activity-title-text">' + escapeHtml(ac.title) + '</div>';
            html += '<div class="activity-meta">';
            html += '<span style="font-size:0.6875rem;font-weight:600;padding:2px 8px;border-radius:100px;background:' + tc.bg + ';color:' + tc.color + '">' + tc.label + '</span>';
            if (ac.organization) html += '<span><i data-lucide="building-2" style="width:0.6875rem;height:0.6875rem"></i> ' + escapeHtml(ac.organization) + '</span>';
            if (ac.date_start) html += '<span>' + formatDateRange(ac.date_start, ac.date_end) + '</span>';
            if (ac.is_verified) html += '<span class="activity-verified"><i data-lucide="check-circle" style="width:0.625rem;height:0.625rem"></i> Vérifié</span>';
            html += '</div></div></div>';
        }
        html += '</div>';
    }
    html += '</div>';

    html += '</div>'; // fin detail-main

    // ═══ SIDEBAR ═══
    html += '<div class="detail-sidebar">';

    // Carte action
    html += '<div class="sidebar-card action-card">';
    html += '<div class="action-price">' + formatPrice(s.price) + '</div>';
    html += '<button class="btn btn-primary btn-block" onclick="handleAddToCart()"><i data-lucide="shopping-cart"></i> Ajouter au panier</button>';
    if (phone) html += '<a href="' + whatsappUrl + '" target="_blank" class="btn btn-whatsapp btn-block"><i data-lucide="message-circle"></i> Contacter via WhatsApp</a>';
    if (p.email) html += '<a href="mailto:' + escapeHtml(p.email) + '" class="btn btn-outline btn-block"><i data-lucide="mail"></i> Envoyer un email</a>';
    html += '</div>';

    // Services similaires
    if (_relatedServices.length > 0) {
        html += '<div class="sidebar-card">';
        html += '<h3 class="sidebar-card-title">Services similaires</h3>';
        for (var j = 0; j < _relatedServices.length; j++) {
            var rs = _relatedServices[j];
            html += '<a href="service-detail.html?id=' + rs.id + '" class="related-item"><div><div class="related-title">' + escapeHtml(rs.title) + '</div><div class="related-price">' + formatPrice(rs.price) + '</div></div><i data-lucide="arrow-right" style="width:1rem;height:1rem;color:var(--border)"></i></a>';
        }
        html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
    lucide.createIcons();
}

// ═══ LIGHTBOX ═══
function showPortfolioLightbox(index) {
    var item = _providerPortfolio[index];
    if (!item) return;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;padding:24px;cursor:pointer;animation:fadeIn .2s ease;backdrop-filter:blur(8px)';
    overlay.onclick = function() { overlay.remove(); };

    var inner = '<div style="max-width:680px;width:100%;text-align:center" onclick="event.stopPropagation()">';
    if (item.media_type === 'video') {
        inner += '<video src="' + escapeHtml(item.media_url) + '" controls style="max-width:100%;max-height:70vh;border-radius:14px"></video>';
    } else {
        inner += '<img src="' + escapeHtml(item.media_url) + '" alt="' + escapeHtml(item.title) + '" style="max-width:100%;max-height:70vh;border-radius:14px;object-fit:contain">';
    }
    inner += '<div style="color:white;margin-top:14px">';
    inner += '<h3 style="font-weight:700;font-size:1rem;margin-bottom:4px">' + escapeHtml(item.title) + '</h3>';
    if (item.description) inner += '<p style="font-size:0.875rem;color:rgba(255,255,255,0.65)">' + escapeHtml(item.description) + '</p>';
    inner += '</div></div>';

    overlay.innerHTML = inner;
    document.body.appendChild(overlay);
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', handler); }
    });
}

// ═══ CART ═══
async function handleAddToCart() {
    if (!_currentService) { showToast('Service non disponible.', 'error'); return; }
    var isAuth = await requireAuth('ajouter ce service à votre panier');
    if (!isAuth) return;

    var cart = JSON.parse(localStorage.getItem('warap_cart') || '[]');
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].serviceId === _currentService.id) {
            showToast('Ce service est déjà dans votre panier.', 'info');
            return;
        }
    }
    cart.push({
        serviceId: _currentService.id,
        title: _currentService.title,
        price: _currentService.price,
        category: _currentService.category || '',
        providerName: _currentProvider.full_name || 'Inconnu',
        providerId: _currentProvider.id,
        addedAt: new Date().toISOString()
    });
    localStorage.setItem('warap_cart', JSON.stringify(cart));
    updateNavCartCount();
    showToast('Service ajouté au panier !', 'success');
}

function updateNavCartCount() {
    var cart = JSON.parse(localStorage.getItem('warap_cart') || '[]');
    var el = document.getElementById('cartCountNav');
    if (el) { el.textContent = cart.length; el.style.display = cart.length > 0 ? 'inline' : 'none'; }
}

// ═══ HELPERS ═══
function escapeHtml(text) { var d = document.createElement('div'); d.textContent = text || ''; return d.innerHTML; }
function formatPrice(price) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'XAF', maximumFractionDigits:0 }).format(price || 0); }
function formatPricingType(type) { return ({ fixed:'Prix fixe', hourly:'Taux horaire', daily:'À la journée', project:'Par projet' })[type] || type; }
function formatPricingTypeDetail(type) { return ({ fixed:'Forfait', hourly:'Horaire', half_day:'Demi-journée', full_day:'Journée', per_person:'Par pers.', custom:'Sur mesure' })[type] || type; }
function formatDateRange(start, end) {
    if (!start) return '';
    var s = new Date(start).toLocaleDateString('fr-FR', { month:'short', year:'numeric' });
    if (!end) return s;
    return s + ' — ' + new Date(end).toLocaleDateString('fr-FR', { month:'short', year:'numeric' });
}
function getActivityTypeConfig(type) {
    var c = {
        certification:  { icon:'certificate',    label:'Certification',  color:'#F59E0B',  bg:'#FFFBEB' },
        training:       { icon:'graduation-cap', label:'Formation',      color:'#3B82F6',  bg:'#EFF6FF' },
        event:          { icon:'calendar-check', label:'Événement',      color:'#8B5CF6', bg:'#F5F3FF' },
        collaboration:  { icon:'users',          label:'Collaboration',  color:'#22C55E', bg:'#F0FDF4' },
        award:          { icon:'trophy',         label:'Récompense',     color:'#F59E0B', bg:'#FFFBEB' },
        other:          { icon:'star',           label:'Autre',          color:'#6B7280', bg:'#F9FAFB' }
    };
    return c[type] || c.other;
}
function showToast(msg, type) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var colors = { success:'#22C55E', error:'#EF4444', info:'#111827' };
    var icons  = { success:'check-circle', error:'x-circle', info:'info' };
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = colors[type] || colors.info;
    toast.innerHTML = '<i data-lucide="' + (icons[type] || 'info') + '" style="width:1.125rem;height:1.125rem"></i> ' + msg;
    document.body.appendChild(toast);
    lucide.createIcons();
    setTimeout(function() { toast.style.opacity='0'; toast.style.transform='translateY(16px)'; toast.style.transition='all .3s ease'; setTimeout(function(){ toast.remove(); }, 300); }, 3500);
}
function renderLoading() {
    return '<div style="text-align:center;padding:80px"><div style="width:32px;height:32px;border:2.5px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 16px"></div><p style="color:var(--text-muted);font-size:0.875rem">Chargement du service...</p></div>';
}
function renderEmptyState(msg, icon) {
    return '<div style="text-align:center;padding:80px"><i data-lucide="' + (icon || 'search-x') + '" style="width:3.5rem;height:3.5rem;color:var(--border);margin-bottom:16px"></i><p style="color:var(--text-muted);font-size:0.9375rem;margin-bottom:20px">' + msg + '</p><a href="services.html" class="btn btn-primary"><i data-lucide="arrow-left"></i> Retour aux services</a></div>';
}
updateNavCartCount();

// ═══ POPUP PRESTATAIRE EN LIGNE ═══
function showOnlinePopup() {
    if (!_currentProvider || !_currentProvider.full_name) return;
    if (localStorage.getItem('popup_shown_' + _currentProvider.id)) return;

    var popup = document.createElement('div');
    popup.className = 'online-popup';
    popup.id = 'onlinePopup';
    popup.innerHTML = 
        '<span class="popup-dot"></span>' +
        '<span>' + escapeHtml(_currentProvider.full_name) + ' est en ligne — Réponse rapide !</span>' +
        '<button onclick="document.getElementById(\'onlinePopup\').remove()"><i data-lucide="x" style="width:1rem;height:1rem"></i></button>';

    document.body.appendChild(popup);
    lucide.createIcons();

    try {
        var audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gA==');
        audio.play().catch(function() {});
    } catch(e) {}

    localStorage.setItem('popup_shown_' + _currentProvider.id, 'true');

    setTimeout(function() {
        var p = document.getElementById('onlinePopup');
        if (p) { p.style.opacity = '0'; p.style.transition = 'opacity .3s'; setTimeout(function(){ if(p) p.remove(); }, 300); }
    }, 6000);
}

// ═══ TOGGLE MENU ═══
function toggleMenu() {
    var nav = document.getElementById('navLinks');
    var toggle = document.getElementById('menuToggle');
    if (!nav || !toggle) return;
    nav.classList.toggle('show');
    toggle.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('show') ? 'hidden' : '';
}

document.addEventListener('DOMContentLoaded', function() {
    var links = document.querySelectorAll('#navLinks a');
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function() {
            var nav = document.getElementById('navLinks');
            var toggle = document.getElementById('menuToggle');
            if (nav) nav.classList.remove('show');
            if (toggle) toggle.classList.remove('open');
            document.body.style.overflow = '';
        });
    }
});