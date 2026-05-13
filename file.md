<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Détail du service — CamServices</title>
    <link href="https://fonts.googleapis.com/css2?family=Allison&family=Outfit:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link rel="stylesheet" href="../css/global.css">
    <style>
        :root {
            --ink:#1A1714;--ink-2:#2E2A25;--muted:#8A8279;--faint:#C9C2B8;
            --rule:#E8E2DA;--cream:#FAF8F5;--white:#FFFFFF;
            --gold:#C4943E;--gold-light:#D4A94E;--gold-dim:rgba(196,148,62,.08);
            --green:#3D8B5E;--green-light:#F0FDF4;--red:#DC2626;
            --blue:#3B82F6;--blue-light:#EFF6FF;--purple:#8B5CF6;--purple-light:#F5F3FF;
            --ff-body:'Outfit',sans-serif;--ff-script:'Allison',cursive;
            --ease:cubic-bezier(.22,1,.36,1);
            --radius:10px;--radius-lg:16px;--radius-xl:20px;
            --shadow:0 4px 20px rgba(26,23,20,.06);
            --shadow-lg:0 12px 40px rgba(26,23,20,.1);
            --max:1200px;
        }
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:var(--ff-body);background:var(--cream);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased;line-height:1.6;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4;transform:scale(1.5)}}

        /* ═══ NAVBAR ═══ */
        .navbar{position:sticky;top:0;z-index:50;background:rgba(250,248,245,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--rule);padding:0 32px;}
        .navbar-inner{max-width:var(--max);margin:0 auto;height:64px;display:flex;align-items:center;justify-content:space-between;}
        .nav-logo{font-weight:700;font-size:1.1rem;color:var(--ink);text-decoration:none;letter-spacing:-.02em;}
        .nav-logo .script{font-family:var(--ff-script);font-size:1.9rem;color:var(--gold);position:relative;top:3px;}
        .nav-links{display:flex;align-items:center;gap:20px;}
        .nav-links a{font-size:.85rem;font-weight:500;color:var(--muted);text-decoration:none;transition:color .2s;}
        .nav-links a:hover{color:var(--ink);}
        .btn-nav{background:var(--ink);color:var(--white)!important;padding:8px 18px;border-radius:var(--radius);font-weight:600!important;}
        .btn-nav:hover{background:var(--ink-2)!important;}
        .cart-badge{background:var(--gold);color:var(--white);font-size:.65rem;font-weight:700;padding:2px 6px;border-radius:10px;margin-left:4px;}

        /* ═══ DETAIL HERO ═══ */
        .detail-hero{background:var(--white);border-bottom:1px solid var(--rule);padding:40px 32px;position:relative;overflow:hidden;}
        .detail-hero::before{content:'';position:absolute;top:-80px;right:-60px;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,var(--gold-dim) 0%,transparent 70%);pointer-events:none;}
        .detail-hero-inner{max-width:var(--max);margin:0 auto;position:relative;z-index:1;}
        .breadcrumb{display:flex;align-items:center;gap:8px;font-size:.78rem;color:var(--muted);margin-bottom:20px;}
        .breadcrumb a{color:var(--muted);text-decoration:none;transition:color .2s;}
        .breadcrumb a:hover{color:var(--gold);}
        .breadcrumb span{color:var(--faint);}
        .detail-header{max-width:700px;}
        .detail-category-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:20px;background:var(--gold-dim);color:var(--gold);font-size:.75rem;font-weight:600;margin-bottom:14px;}
        .detail-title{font-weight:800;font-size:clamp(1.6rem,3.5vw,2.2rem);letter-spacing:-.03em;margin-bottom:10px;line-height:1.2;}
        .detail-price{font-size:1.4rem;font-weight:800;color:var(--gold);}
        .detail-price .price-type{font-size:.8rem;font-weight:500;color:var(--muted);margin-left:6px;}

        /* ═══ LAYOUT ═══ */
        .detail-layout{max-width:var(--max);margin:0 auto;padding:32px;display:grid;grid-template-columns:1fr 360px;gap:28px;align-items:start;}
        .detail-main{display:flex;flex-direction:column;gap:24px;}

        /* ═══ CARDS ═══ */
        .detail-card{background:var(--white);border:1px solid var(--rule);border-radius:var(--radius-lg);padding:28px;animation:fadeUp .5s var(--ease);}
        .detail-section-title{display:flex;align-items:center;gap:10px;font-size:1rem;font-weight:700;margin-bottom:18px;letter-spacing:-.02em;}
        .detail-section-title i{width:1.1rem;height:1.1rem;color:var(--gold);}
        .detail-description{font-size:.88rem;color:var(--ink-2);line-height:1.8;white-space:pre-line;}

        .detail-info-row{display:flex;gap:20px;flex-wrap:wrap;margin-top:20px;padding-top:18px;border-top:1px solid var(--rule);}
        .detail-info-item{flex:1;min-width:120px;}
        .detail-info-label{display:block;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:4px;}
        .detail-info-value{font-size:.88rem;font-weight:600;color:var(--ink);}

        /* ═══ PROVIDER PROFILE ═══ */
        .provider-profile{display:flex;gap:20px;align-items:flex-start;}
        .provider-avatar-large{width:72px;height:72px;border-radius:var(--radius-lg);background:var(--cream);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:2px solid var(--rule);}
        .provider-avatar-large img{width:100%;height:100%;object-fit:cover;}
        .provider-avatar-initials{font-size:1.4rem;font-weight:700;color:var(--faint);}
        .provider-details{flex:1;}
        .provider-name{font-weight:700;font-size:1.05rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;}
        .verified-badge{display:inline-flex;align-items:center;gap:4px;font-size:.68rem;font-weight:600;color:var(--green);background:var(--green-light);padding:3px 10px;border-radius:20px;}
        .verified-badge i{width:.7rem;height:.7rem;}
        .provider-location{font-size:.82rem;color:var(--muted);display:flex;align-items:center;gap:5px;margin-bottom:6px;}
        .provider-location i{width:.85rem;height:.85rem;}
        .provider-bio{font-size:.82rem;color:var(--ink-2);line-height:1.6;margin-bottom:10px;}
        .expertise-tags{display:flex;flex-wrap:wrap;gap:6px;}
        .expertise-tag{font-size:.7rem;padding:4px 10px;border-radius:6px;background:var(--gold-dim);color:var(--gold);font-weight:600;}

        /* ═══ STATS GRID ═══ */
        .stats-mini{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px;padding-top:18px;border-top:1px solid var(--rule);}
        .stat-mini{text-align:center;padding:12px 8px;background:var(--cream);border-radius:var(--radius);border:1px solid var(--rule);}
        .stat-mini-value{font-size:1.1rem;font-weight:800;color:var(--ink);margin-bottom:2px;}
        .stat-mini-label{font-size:.65rem;color:var(--muted);font-weight:500;}

        /* ═══ PRICING GRID ═══ */
        .pricing-list{display:flex;flex-direction:column;gap:12px;}
        .pricing-item{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:var(--cream);border:1px solid var(--rule);border-radius:var(--radius);transition:all .2s;}
        .pricing-item:hover{border-color:var(--gold);background:var(--white);}
        .pricing-item-info{flex:1;}
        .pricing-item-name{font-weight:700;font-size:.88rem;margin-bottom:2px;}
        .pricing-item-desc{font-size:.75rem;color:var(--muted);}
        .pricing-item-meta{display:flex;align-items:center;gap:8px;margin-top:4px;}
        .pricing-item-tag{font-size:.65rem;padding:2px 8px;border-radius:4px;background:var(--gold-dim);color:var(--gold);font-weight:600;}
        .pricing-item-price{font-weight:800;font-size:1rem;color:var(--gold);white-space:nowrap;}

        /* ═══ PORTFOLIO GRID ═══ */
        .portfolio-mini-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
        .portfolio-thumb{border-radius:var(--radius);overflow:hidden;aspect-ratio:1;background:var(--cream);border:1px solid var(--rule);cursor:pointer;position:relative;transition:all .2s;}
        .portfolio-thumb:hover{border-color:var(--gold);transform:scale(1.03);}
        .portfolio-thumb img{width:100%;height:100%;object-fit:cover;}
        .portfolio-thumb .featured-dot{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--gold);border:2px solid var(--white);}

        /* ═══ ACTIVITIES TIMELINE ═══ */
        .activity-timeline{display:flex;flex-direction:column;gap:14px;}
        .activity-item{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:var(--cream);border:1px solid var(--rule);border-radius:var(--radius);transition:border-color .2s;}
        .activity-item:hover{border-color:var(--gold);}
        .activity-dot{width:36px;height:36px;border-radius:var(--radius);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .activity-dot i{width:1rem;height:1rem;}
        .activity-info{flex:1;min-width:0;}
        .activity-title-text{font-weight:700;font-size:.82rem;margin-bottom:2px;}
        .activity-meta{font-size:.72rem;color:var(--muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .activity-verified{font-size:.65rem;font-weight:600;padding:2px 8px;border-radius:10px;background:var(--green-light);color:var(--green);display:inline-flex;align-items:center;gap:3px;}

        /* ═══ SIDEBAR ═══ */
        .detail-sidebar{display:flex;flex-direction:column;gap:20px;position:sticky;top:88px;}
        .sidebar-card{background:var(--white);border:1px solid var(--rule);border-radius:var(--radius-lg);padding:24px;animation:fadeUp .5s var(--ease);}
        .sidebar-card-title{font-weight:700;font-size:.9rem;margin-bottom:16px;letter-spacing:-.02em;}
        .action-card{text-align:center;}
        .action-price{font-size:1.8rem;font-weight:800;color:var(--ink);margin-bottom:16px;letter-spacing:-.03em;}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:var(--radius);font-family:var(--ff-body);font-size:.85rem;font-weight:600;cursor:pointer;transition:all .2s;border:none;text-decoration:none;}
        .btn-block{display:flex;width:100%;margin-bottom:10px;}
        .btn-dark{background:var(--ink);color:var(--white);}
        .btn-dark:hover{background:var(--ink-2);}
        .btn-whatsapp{background:#25D366;color:var(--white);}
        .btn-whatsapp:hover{background:#1EBE57;}
        .btn-ghost{background:transparent;color:var(--muted);border:1.5px solid var(--rule);}
        .btn-ghost:hover{border-color:var(--ink);color:var(--ink);}
        .btn i{width:1rem;height:1rem;}
        .related-service-item{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--rule);text-decoration:none;color:inherit;transition:color .2s;}
        .related-service-item:last-child{border-bottom:none;}
        .related-service-item:hover .related-service-title{color:var(--gold);}
        .related-service-title{font-weight:600;font-size:.82rem;transition:color .2s;}
        .related-service-price{font-size:.78rem;color:var(--gold);font-weight:700;margin-top:2px;}

        .status-badge{display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:600;}
        .status-active{background:var(--green-light);color:var(--green);}
        .status-inactive{background:#FEF2F2;color:var(--red);}

        /* ═══ EMPTY / MUTED SECTION ═══ */
        .empty-section{text-align:center;padding:24px;color:var(--faint);font-size:.82rem;}
        .empty-section i{width:2rem;height:2rem;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;}

        /* ═══ RESPONSIVE ═══ */
        @media(max-width:900px){
            .detail-layout{grid-template-columns:1fr;padding:20px;}
            .detail-sidebar{position:static;}
            .detail-hero{padding:28px 20px;}
            .stats-mini{grid-template-columns:repeat(2,1fr);}
            .portfolio-mini-grid{grid-template-columns:repeat(2,1fr);}
            .provider-profile{flex-direction:column;align-items:center;text-align:center;}
            .expertise-tags{justify-content:center;}
        }
        @media(max-width:500px){
            .navbar{padding:0 16px;}
            .nav-links{gap:12px;}
            .detail-layout{padding:16px;}
            .detail-card{padding:20px;}
        }
    </style>
</head>
<body>

<!-- ═══ NAVBAR ═══ -->
<nav class="navbar">
    <div class="navbar-inner">
        <a href="landing.html" class="nav-logo">Cam<span class="script">S</span>ervices</a>
        <div class="nav-links">
            <a href="services.html">Services</a>
            <a href="cart.html" style="position:relative;display:flex;align-items:center;gap:6px">
        <i data-lucide="shopping-cart" style="width:1rem;height:1rem"></i> Panier
        <span id="cartCountNav" style="background:var(--gold);color:white;font-size:.65rem;font-weight:700;padding:2px 7px;border-radius:10px;display:none">0</span>
    </a>
        </div>
    </div>
</nav>

<!-- ═══ CONTENU ═══ -->
<div id="service-detail">
    <div style="text-align:center;padding:80px">
        <div class="spinner" style="width:32px;height:32px;border:2.5px solid #E8E2DA;border-top-color:#C4943E;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 16px"></div>
        <p style="color:#8A8279">Chargement du service...</p>
    </div>
</div>

<!-- ═══ SCRIPTS ═══ -->
 <script src="../js/global.js"></script>
<script>
// ============================================================
//  SERVICE-DETAIL.JS — CamServices
//  Enrichi : portfolio, pricing_grid, activities, stats
// ============================================================

const SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';


const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// Variables globales
var _currentService   = null;
var _currentProvider  = null;
var _relatedServices  = [];
var _providerStats    = null;
var _providerPricing  = [];
var _providerPortfolio = [];
var _providerActivities = [];

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    loadServiceDetail();
});

// ═══ ID depuis l'URL ═══
function getServiceId() {
    return new URLSearchParams(window.location.search).get('id');
}

// ═══ CHARGER TOUT ═══
async function loadServiceDetail() {
    var serviceId = getServiceId();
    var container = document.getElementById('service-detail');

    if (!serviceId) {
        container.innerHTML = renderEmptyState('Aucun service spécifié.', 'search-x');
        return;
    }

    container.innerHTML = renderLoading();

    try {
        // 1. Service + prestataire
        var { data: service, error } = await sb
            .from('services')
            .select('*, provider:user_id(id, full_name, phone, email, city, neighborhood, profile_photo_url, is_verified, bio, domain_expertise, education, side_activities, employment_status, created_at)')
            .eq('id', serviceId)
            .single();

        if (error) throw error;
        if (!service) { container.innerHTML = renderEmptyState('Service introuvable.', 'package-x'); return; }

        _currentService  = service;
        _currentProvider = service.provider || {};

        // 2. Charger en parallèle toutes les données du prestataire
        var providerId = _currentProvider.id;

        var [relRes, statsRes, pricingRes, portfolioRes, activitiesRes] = await Promise.all([
            // Services similaires
            sb.from('services')
              .select('*, provider:user_id(id, full_name, city, profile_photo_url, is_verified)')
              .eq('category', service.category).eq('is_active', true).neq('id', serviceId).limit(3),
            // Stats du prestataire
            providerId ? sb.from('provider_stats').select('*').eq('provider_id', providerId).maybeSingle() : { data: null },
            // Grille tarifaire
            providerId ? sb.from('pricing_grid').select('*').eq('user_id', providerId).eq('is_active', true).order('base_price') : { data: [] },
            // Portfolio
            providerId ? sb.from('portfolio_items').select('*').eq('user_id', providerId).order('is_featured', { ascending: false }).order('display_order').limit(9) : { data: [] },
            // Activités
            providerId ? sb.from('provider_activities').select('*').eq('user_id', providerId).order('date_start', { ascending: false, nullsFirst: false }).limit(5) : { data: [] }
        ]);

        _relatedServices    = (relRes.data || []).filter(function(s) { return s.provider !== null; });
        _providerStats      = statsRes.data || null;
        _providerPricing    = pricingRes.data || [];
        _providerPortfolio  = portfolioRes.data || [];
        _providerActivities = activitiesRes.data || [];

        // 3. Enregistrer la vue
        recordProfileView();

        // 4. Render
        renderServiceDetail();

    } catch (err) {
        console.error('Erreur chargement service:', err);
        container.innerHTML = renderEmptyState('Erreur : ' + err.message, 'alert-triangle');
    }
}

// ═══ VUE DU PROFIL ═══
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

// ═══ RENDER PRINCIPAL ═══
function renderServiceDetail() {
    var container = document.getElementById('service-detail');
    var s = _currentService;
    var p = _currentProvider;

    var phone = (p.phone || '').replace(/\s+/g, '').replace('+', '');
    var whatsappUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Bonjour, je suis intéressé par votre service "' + s.title + '" sur CamServices.');
    var initials = (p.full_name || '?').split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase();

    var categoryEmojis = {
        'Plomberie':'🔧','Électricité':'⚡','Ménage':'🏠','Photographie':'📸',
        'Développement web':'💻','Cours particuliers':'📚','Transport':'🚗',
        'Design':'🎨','Beauté':'💄','Bâtiment':'🏗️'
    };

    var html = '';

    // ═══ HERO ═══
    html += '<section class="detail-hero"><div class="detail-hero-inner">';
    html += '<div class="breadcrumb"><a href="landing.html">Accueil</a> <span>/</span> <a href="services.html">Services</a> <span>/</span> <span>' + escapeHtml(s.title) + '</span></div>';
    html += '<div class="detail-header">';
    html += '<div class="detail-category-badge">' + (categoryEmojis[s.category] || '🛠️') + ' ' + escapeHtml(s.category || 'Service') + '</div>';
    html += '<h1 class="detail-title">' + escapeHtml(s.title) + '</h1>';
    html += '<div class="detail-price">' + formatPrice(s.price) + ' <span class="price-type">' + formatPricingType(s.pricing_type) + '</span></div>';
    html += '</div></div></section>';

    // ═══ LAYOUT ═══
    html += '<div class="detail-layout">';
    html += '<div class="detail-main">';

    // ── Description ──
    html += '<div class="detail-card">';
    html += '<h2 class="detail-section-title"><i data-lucide="file-text"></i> Description</h2>';
    html += '<div class="detail-description">' + escapeHtml(s.description || 'Aucune description fournie pour ce service.') + '</div>';
    html += '<div class="detail-info-row">';
    html += '<div class="detail-info-item"><span class="detail-info-label">Type de prix</span><span class="detail-info-value">' + formatPricingType(s.pricing_type) + '</span></div>';
    if (s.duration_minutes) {
        html += '<div class="detail-info-item"><span class="detail-info-label">Durée estimée</span><span class="detail-info-value">' + s.duration_minutes + ' minutes</span></div>';
    }
    html += '<div class="detail-info-item"><span class="detail-info-label">Statut</span><span class="detail-info-value"><span class="status-badge ' + (s.is_active ? 'status-active' : 'status-inactive') + '">' + (s.is_active ? 'Disponible' : 'Indisponible') + '</span></span></div>';
    html += '</div></div>';

    // ── Prestataire ──
    html += '<div class="detail-card">';
    html += '<h2 class="detail-section-title"><i data-lucide="user-circle"></i> À propos du prestataire</h2>';
    html += '<div class="provider-profile">';
    html += '<div class="provider-avatar-large">';
    if (p.profile_photo_url) {
        html += '<img src="' + p.profile_photo_url + '" alt="' + escapeHtml(p.full_name) + '">';
    } else {
        html += '<span class="provider-avatar-initials">' + initials + '</span>';
    }
    html += '</div>';
    html += '<div class="provider-details">';
    html += '<h3 class="provider-name">' + escapeHtml(p.full_name || 'Inconnu');
    if (p.is_verified) html += ' <span class="verified-badge"><i data-lucide="shield-check"></i> Vérifié</span>';
    html += '</h3>';
    if (p.city) html += '<p class="provider-location"><i data-lucide="map-pin"></i> ' + escapeHtml(p.city) + (p.neighborhood ? ', ' + escapeHtml(p.neighborhood) : '') + '</p>';
    if (p.bio) html += '<p class="provider-bio">' + escapeHtml(p.bio) + '</p>';

    // Infos supplémentaires
    var extraInfo = [];
    if (p.education) extraInfo.push('<i data-lucide="graduation-cap" style="width:.8rem;height:.8rem;color:var(--blue)"></i> ' + escapeHtml(p.education));
    if (p.employment_status) {
        var empMap = { employed:'Employé', unemployed:'Indépendant', self_employed:'Auto-entrepreneur', student:'Étudiant' };
        extraInfo.push('<i data-lucide="briefcase" style="width:.8rem;height:.8rem;color:var(--muted)"></i> ' + (empMap[p.employment_status] || p.employment_status));
    }
    if (p.side_activities) extraInfo.push('<i data-lucide="activity" style="width:.8rem;height:.8rem;color:var(--purple)"></i> ' + escapeHtml(p.side_activities));
    if (p.created_at) {
        var memberSince = new Date(p.created_at).toLocaleDateString('fr-FR', { month:'long', year:'numeric' });
        extraInfo.push('<i data-lucide="calendar" style="width:.8rem;height:.8rem;color:var(--faint)"></i> Membre depuis ' + memberSince);
    }
    if (extraInfo.length > 0) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:12px;margin:10px 0;font-size:.78rem;color:var(--muted)">';
        for (var i = 0; i < extraInfo.length; i++) {
            html += '<span style="display:inline-flex;align-items:center;gap:5px">' + extraInfo[i] + '</span>';
        }
        html += '</div>';
    }

    if (p.domain_expertise && p.domain_expertise.length > 0) {
        html += '<div class="expertise-tags">';
        for (var i = 0; i < p.domain_expertise.length; i++) {
            html += '<span class="expertise-tag">' + escapeHtml(p.domain_expertise[i]) + '</span>';
        }
        html += '</div>';
    }
    html += '</div></div>';

    // ── Stats du prestataire ──
    if (_providerStats) {
        var st = _providerStats;
        html += '<div class="stats-mini">';
        html += '<div class="stat-mini"><div class="stat-mini-value">' + (st.completed_orders || 0) + '</div><div class="stat-mini-label">Commandes réalisées</div></div>';
        html += '<div class="stat-mini"><div class="stat-mini-value">' + (st.average_rating ? st.average_rating.toFixed(1) : '—') + '</div><div class="stat-mini-label">Note moyenne</div></div>';
        html += '<div class="stat-mini"><div class="stat-mini-value">' + (st.total_reviews || 0) + '</div><div class="stat-mini-label">Avis clients</div></div>';
        html += '<div class="stat-mini"><div class="stat-mini-value">' + (st.response_rate ? Math.round(st.response_rate) + '%' : '—') + '</div><div class="stat-mini-label">Taux de réponse</div></div>';
        html += '</div>';
    }
    html += '</div>';

    // ── Grille tarifaire ──
    html += '<div class="detail-card">';
    html += '<h2 class="detail-section-title"><i data-lucide="tags"></i> Grille tarifaire</h2>';
    if (_providerPricing.length === 0) {
        html += '<div class="empty-section"><i data-lucide="tags"></i>Aucun tarif publié pour l\'instant</div>';
    } else {
        html += '<div class="pricing-list">';
        for (var i = 0; i < _providerPricing.length; i++) {
            var pr = _providerPricing[i];
            html += '<div class="pricing-item">';
            html += '<div class="pricing-item-info">';
            html += '<div class="pricing-item-name">' + escapeHtml(pr.name) + '</div>';
            if (pr.description) html += '<div class="pricing-item-desc">' + escapeHtml(pr.description).substring(0, 80) + '</div>';
            html += '<div class="pricing-item-meta">';
            html += '<span class="pricing-item-tag">' + formatPricingTypeDetail(pr.pricing_type) + '</span>';
            if (pr.duration_hours) html += '<span style="font-size:.7rem;color:var(--muted)">' + pr.duration_hours + 'h</span>';
            if (pr.max_people) html += '<span style="font-size:.7rem;color:var(--muted)">Max ' + pr.max_people + ' pers.</span>';
            html += '</div>';
            if (pr.includes && pr.includes.length > 0) {
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">';
                for (var k = 0; k < Math.min(pr.includes.length, 3); k++) {
                    html += '<span style="font-size:.65rem;padding:2px 6px;border-radius:4px;background:var(--green-light);color:var(--green)">✓ ' + escapeHtml(pr.includes[k]) + '</span>';
                }
                if (pr.includes.length > 3) html += '<span style="font-size:.65rem;color:var(--muted)">+' + (pr.includes.length - 3) + '</span>';
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
    html += '<div class="detail-card">';
    html += '<h2 class="detail-section-title"><i data-lucide="image"></i> Portfolio / Réalisations</h2>';
    if (_providerPortfolio.length === 0) {
        html += '<div class="empty-section"><i data-lucide="camera"></i>Aucune réalisation publiée</div>';
    } else {
        html += '<div class="portfolio-mini-grid">';
        for (var i = 0; i < _providerPortfolio.length; i++) {
            var po = _providerPortfolio[i];
            html += '<div class="portfolio-thumb" onclick="showPortfolioLightbox(' + i + ')">';
            html += '<img src="' + escapeHtml(po.media_url) + '" alt="' + escapeHtml(po.title) + '" loading="lazy" onerror="this.style.display=\'none\'">';
            if (po.is_featured) html += '<div class="featured-dot"></div>';
            html += '</div>';
        }
        html += '</div>';
    }
    html += '</div>';

    // ── Activités & Certifications ──
    html += '<div class="detail-card">';
    html += '<h2 class="detail-section-title"><i data-lucide="award"></i> Activités & Certifications</h2>';
    if (_providerActivities.length === 0) {
        html += '<div class="empty-section"><i data-lucide="award"></i>Aucune activité enregistrée</div>';
    } else {
        html += '<div class="activity-timeline">';
        for (var i = 0; i < _providerActivities.length; i++) {
            var ac = _providerActivities[i];
            var tc = getActivityTypeConfig(ac.activity_type);
            html += '<div class="activity-item">';
            html += '<div class="activity-dot" style="background:' + tc.bg + '"><i data-lucide="' + tc.icon + '" style="color:' + tc.color + '"></i></div>';
            html += '<div class="activity-info">';
            html += '<div class="activity-title-text">' + escapeHtml(ac.title) + '</div>';
            html += '<div class="activity-meta">';
            html += '<span style="font-size:.68rem;font-weight:600;padding:2px 8px;border-radius:4px;background:' + tc.bg + ';color:' + tc.color + '">' + tc.label + '</span>';
            if (ac.organization) html += '<span><i data-lucide="building-2" style="width:.7rem;height:.7rem"></i> ' + escapeHtml(ac.organization) + '</span>';
            if (ac.date_start) html += '<span>' + formatDateRange(ac.date_start, ac.date_end) + '</span>';
            if (ac.is_verified) html += '<span class="activity-verified"><i data-lucide="check-circle" style="width:.6rem;height:.6rem"></i> Vérifié</span>';
            html += '</div></div></div>';
        }
        html += '</div>';
    }
    html += '</div>';

    html += '</div>'; // fin .detail-main

    // ═══ SIDEBAR ═══
    html += '<div class="detail-sidebar">';

    // Carte action
    html += '<div class="sidebar-card action-card">';
    html += '<div class="action-price">' + formatPrice(s.price) + '</div>';
    html += '<button class="btn btn-dark btn-block" onclick="handleAddToCart()"><i data-lucide="shopping-cart"></i> Ajouter au panier</button>';
    if (phone) html += '<a href="' + whatsappUrl + '" target="_blank" class="btn btn-whatsapp btn-block"><i data-lucide="message-circle"></i> Contacter via WhatsApp</a>';
    if (p.email) html += '<a href="mailto:' + escapeHtml(p.email) + '" class="btn btn-ghost btn-block"><i data-lucide="mail"></i> Envoyer un email</a>';
    html += '</div>';

    // Services similaires
    if (_relatedServices.length > 0) {
        html += '<div class="sidebar-card">';
        html += '<h3 class="sidebar-card-title">Services similaires</h3>';
        for (var j = 0; j < _relatedServices.length; j++) {
            var rs = _relatedServices[j];
            html += '<a href="service-detail.html?id=' + rs.id + '" class="related-service-item"><div><div class="related-service-title">' + escapeHtml(rs.title) + '</div><div class="related-service-price">' + formatPrice(rs.price) + '</div></div><i data-lucide="arrow-right" style="width:1rem;height:1rem;color:var(--faint)"></i></a>';
        }
        html += '</div>';
    }

    html += '</div>'; // fin sidebar
    html += '</div>'; // fin layout

    container.innerHTML = html;
    lucide.createIcons();
}

// ═══ LIGHTBOX PORTFOLIO ═══
function showPortfolioLightbox(index) {
    var item = _providerPortfolio[index];
    if (!item) return;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:24px;cursor:pointer;animation:fadeUp .3s ease';
    overlay.onclick = function() { overlay.remove(); };

    var inner = '<div style="max-width:700px;width:100%;text-align:center" onclick="event.stopPropagation()">';
    if (item.media_type === 'video') {
        inner += '<video src="' + escapeHtml(item.media_url) + '" controls style="max-width:100%;max-height:70vh;border-radius:12px"></video>';
    } else {
        inner += '<img src="' + escapeHtml(item.media_url) + '" alt="' + escapeHtml(item.title) + '" style="max-width:100%;max-height:70vh;border-radius:12px;object-fit:contain">';
    }
    inner += '<div style="color:white;margin-top:16px">';
    inner += '<h3 style="font-weight:700;font-size:1rem;margin-bottom:4px">' + escapeHtml(item.title) + '</h3>';
    if (item.description) inner += '<p style="font-size:.82rem;color:rgba(255,255,255,.7)">' + escapeHtml(item.description) + '</p>';
    if (item.tags && item.tags.length) {
        inner += '<div style="display:flex;gap:6px;justify-content:center;margin-top:8px;flex-wrap:wrap">';
        for (var t = 0; t < item.tags.length; t++) {
            inner += '<span style="font-size:.68rem;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,.15);color:rgba(255,255,255,.8)">' + escapeHtml(item.tags[t]) + '</span>';
        }
        inner += '</div>';
    }
    inner += '</div></div>';

    overlay.innerHTML = inner;
    document.body.appendChild(overlay);
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', handler); }
    });
}

// ═══ PANIER — Plus besoin d'être connecté pour ajouter ═══
function handleAddToCart() {
    if (!_currentService) { showToast('Service non disponible.', 'error'); return; }

    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].serviceId === _currentService.id) {
            showToast('Ce service est déjà dans votre panier.', 'info');
            openCartDrawer();
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
    localStorage.setItem('camservices_cart', JSON.stringify(cart));
    updateNavCartCount();
    showToast('Service ajouté au panier !', 'success');
}

// ═══ SUPPRIMER DU PANIER ═══
function removeFromCart(serviceId) {
    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    cart = cart.filter(function(item) { return item.serviceId !== serviceId; });
    localStorage.setItem('camservices_cart', JSON.stringify(cart));
    updateNavCartCount();
    openCartDrawer(); // re-render le drawer
}

// ═══ VIDER LE PANIER ═══
function clearCart() {
    localStorage.removeItem('camservices_cart');
    updateNavCartCount();
    openCartDrawer();
}

// ═══ CART DRAWER (panneau latéral) ═══
function openCartDrawer() {
    // Supprimer un drawer existant
    var old = document.getElementById('cartDrawerOverlay');
    if (old) old.remove();

    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    var total = cart.reduce(function(sum, item) { return sum + (item.price || 0); }, 0);

    var overlay = document.createElement('div');
    overlay.id = 'cartDrawerOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(26,23,20,.4);backdrop-filter:blur(4px);animation:modalFadeIn .2s ease;';
    overlay.onclick = function(e) { if (e.target === overlay) closeCartDrawer(); };

    var drawerHtml = '';
    drawerHtml += '<div id="cartDrawer" style="position:fixed;top:0;right:0;bottom:0;width:420px;max-width:100vw;background:var(--white);box-shadow:-8px 0 40px rgba(26,23,20,.15);display:flex;flex-direction:column;z-index:9501;animation:slideInRight .3s cubic-bezier(.22,1,.36,1)">';

    // Header
    drawerHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--rule)">';
    drawerHtml += '<h3 style="font-weight:700;font-size:1rem;display:flex;align-items:center;gap:8px"><i data-lucide="shopping-cart" style="width:1.1rem;height:1.1rem;color:var(--gold)"></i> Mon panier <span style="font-size:.75rem;font-weight:500;color:var(--muted)">(' + cart.length + ')</span></h3>';
    drawerHtml += '<button onclick="closeCartDrawer()" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:6px"><i data-lucide="x" style="width:1.2rem;height:1.2rem"></i></button>';
    drawerHtml += '</div>';

    // Body
    drawerHtml += '<div style="flex:1;overflow-y:auto;padding:20px 24px">';
    if (cart.length === 0) {
        drawerHtml += '<div style="text-align:center;padding:48px 0;color:var(--faint)">';
        drawerHtml += '<i data-lucide="shopping-bag" style="width:3rem;height:3rem;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto"></i>';
        drawerHtml += '<p style="font-size:.88rem;font-weight:600;color:var(--muted);margin-bottom:4px">Votre panier est vide</p>';
        drawerHtml += '<p style="font-size:.78rem;color:var(--faint)">Parcourez les services et ajoutez-en à votre panier</p>';
        drawerHtml += '<a href="services.html" style="display:inline-flex;align-items:center;gap:6px;margin-top:16px;padding:10px 18px;background:var(--ink);color:var(--white);border-radius:var(--radius);text-decoration:none;font-weight:600;font-size:.82rem"><i data-lucide="search" style="width:.9rem;height:.9rem"></i> Explorer les services</a>';
        drawerHtml += '</div>';
    } else {
        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            drawerHtml += '<div style="display:flex;gap:14px;align-items:flex-start;padding:16px 0;' + (i > 0 ? 'border-top:1px solid var(--rule)' : '') + '">';
            drawerHtml += '<div style="width:44px;height:44px;border-radius:var(--radius);background:var(--gold-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i data-lucide="briefcase" style="width:1.1rem;height:1.1rem;color:var(--gold)"></i></div>';
            drawerHtml += '<div style="flex:1;min-width:0">';
            drawerHtml += '<div style="font-weight:700;font-size:.85rem;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(item.title) + '</div>';
            drawerHtml += '<div style="font-size:.75rem;color:var(--muted)">' + escapeHtml(item.providerName) + '</div>';
            drawerHtml += '<div style="font-weight:800;font-size:.88rem;color:var(--gold);margin-top:4px">' + formatPrice(item.price) + '</div>';
            drawerHtml += '</div>';
            drawerHtml += '<button onclick="removeFromCart(\'' + item.serviceId + '\')" style="background:none;border:none;cursor:pointer;color:var(--faint);padding:4px;transition:color .2s" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--faint)\'"><i data-lucide="trash-2" style="width:.9rem;height:.9rem"></i></button>';
            drawerHtml += '</div>';
        }
    }
    drawerHtml += '</div>';

    // Footer
    if (cart.length > 0) {
        drawerHtml += '<div style="padding:20px 24px;border-top:1px solid var(--rule);background:var(--cream)">';
        drawerHtml += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
        drawerHtml += '<span style="font-size:.85rem;font-weight:600;color:var(--muted)">Total</span>';
        drawerHtml += '<span style="font-size:1.2rem;font-weight:800;color:var(--ink)">' + formatPrice(total) + '</span>';
        drawerHtml += '</div>';
        drawerHtml += '<button onclick="handleCheckout()" class="btn btn-dark btn-block" style="margin-bottom:8px"><i data-lucide="credit-card"></i> Passer commande</button>';
        drawerHtml += '<button onclick="clearCart()" style="width:100%;padding:10px;background:none;border:1px solid var(--rule);border-radius:var(--radius);font-family:var(--ff-body);font-size:.78rem;font-weight:500;color:var(--muted);cursor:pointer;transition:all .2s" onmouseover="this.style.borderColor=\'var(--red)\';this.style.color=\'var(--red)\'" onmouseout="this.style.borderColor=\'var(--rule)\';this.style.color=\'var(--muted)\'">Vider le panier</button>';
        drawerHtml += '</div>';
    }

    drawerHtml += '</div>';

    overlay.innerHTML = drawerHtml;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeCartDrawer() {
    var overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
}

// ═══ CHECKOUT — Ici on demande l'auth ═══
async function handleCheckout() {
    var { data } = await sb.auth.getSession();
    if (!data.session) {
        showToast('Connectez-vous pour passer commande.', 'info');
        // Sauvegarder l'intention de checkout
        localStorage.setItem('camservices_redirect', 'checkout');
        setTimeout(function() { window.location.href = 'login.html'; }, 1500);
        return;
    }
    // Rediriger vers la page checkout (à créer) ou traiter ici
    closeCartDrawer();
    showToast('Redirection vers le paiement...', 'info');
    setTimeout(function() { window.location.href = 'checkout.html'; }, 800);
}

// Animation slide drawer
(function() {
    var s = document.createElement('style');
    s.textContent = '@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes modalFadeIn{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(s);
})();

// ═══ HELPERS ═══
function escapeHtml(text) { var d = document.createElement('div'); d.textContent = text || ''; return d.innerHTML; }

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'XAF', maximumFractionDigits:0 }).format(price || 0);
}

function formatPricingType(type) {
    return ({ fixed:'Prix fixe', hourly:'Taux horaire', daily:'À la journée', project:'Par projet' })[type] || type;
}

function formatPricingTypeDetail(type) {
    return ({ fixed:'Forfait', hourly:'Horaire', half_day:'Demi-journée', full_day:'Journée', per_person:'Par pers.', custom:'Sur mesure' })[type] || type;
}

function formatDateRange(start, end) {
    if (!start) return '';
    var s = new Date(start).toLocaleDateString('fr-FR', { month:'short', year:'numeric' });
    if (!end) return s;
    return s + ' — ' + new Date(end).toLocaleDateString('fr-FR', { month:'short', year:'numeric' });
}

function getActivityTypeConfig(type) {
    var c = {
        certification:  { icon:'certificate',    label:'Certification',  color:'var(--gold)',  bg:'var(--gold-dim)' },
        training:       { icon:'graduation-cap', label:'Formation',      color:'var(--blue)',  bg:'var(--blue-light)' },
        event:          { icon:'calendar-check', label:'Événement',      color:'var(--purple)', bg:'var(--purple-light)' },
        collaboration:  { icon:'users',          label:'Collaboration',  color:'var(--green)', bg:'var(--green-light)' },
        award:          { icon:'trophy',         label:'Récompense',     color:'#F59E0B',      bg:'#FFFBEB' },
        other:          { icon:'star',           label:'Autre',          color:'var(--muted)', bg:'var(--cream)' }
    };
    return c[type] || c.other;
}

function showToast(msg, type) {
    var existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    var colors = { success:'#3D8B5E', error:'#DC2626', info:'#1A1714' };
    var icons  = { success:'check-circle', error:'x-circle', info:'info' };
    var toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:' + (colors[type] || colors.info) + ';color:white;padding:14px 22px;border-radius:12px;font-weight:600;font-size:.85rem;box-shadow:0 8px 32px rgba(0,0,0,.2);display:flex;align-items:center;gap:10px;font-family:Outfit,sans-serif;animation:toastUp .3s ease';
    toast.innerHTML = '<i data-lucide="' + (icons[type] || 'info') + '" style="width:1.2rem;height:1.2rem"></i> ' + msg;
    document.body.appendChild(toast);
    lucide.createIcons();
    setTimeout(function() { toast.style.opacity='0'; toast.style.transform='translateY(20px)'; toast.style.transition='all .3s ease'; setTimeout(function(){ toast.remove(); }, 300); }, 3500);
}

function renderLoading() {
    return '<div style="text-align:center;padding:80px"><div class="spinner" style="width:32px;height:32px;border:2.5px solid #E8E2DA;border-top-color:#C4943E;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 16px"></div><p style="color:#8A8279">Chargement du service...</p></div>';
}

function renderEmptyState(msg, icon) {
    return '<div style="text-align:center;padding:80px"><i data-lucide="' + (icon || 'search-x') + '" style="width:4rem;height:4rem;color:#C9C2B8;margin-bottom:12px"></i><p style="color:#8A8279">' + msg + '</p><a href="services.html" style="display:inline-flex;align-items:center;gap:6px;margin-top:16px;padding:10px 20px;background:#1A1714;color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:.85rem"><i data-lucide="arrow-left" style="width:1rem;height:1rem"></i> Retour aux services</a></div>';
}

function updateNavCartCount() {
    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    var el = document.getElementById('cartCountNav');
    if (el) { el.textContent = cart.length; el.style.display = cart.length > 0 ? 'inline' : 'none'; }
}

updateNavCartCount();
</script>
</body>
</html>

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_id uuid,
  client_id uuid,
  provider_id uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'deleted'::text])),
  total_amount numeric NOT NULL,
  client_message text,
  scheduled_date timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  deleted_at timestamp with time zone,
  is_restored boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id),
  CONSTRAINT orders_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id)
);
CREATE TABLE public.portfolio_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  media_url text NOT NULL,
  media_type text DEFAULT 'image'::text CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text])),
  category text,
  tags ARRAY,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT portfolio_items_pkey PRIMARY KEY (id),
  CONSTRAINT portfolio_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.pricing_grid (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  service_id uuid,
  name text NOT NULL,
  description text,
  base_price numeric NOT NULL,
  pricing_type text DEFAULT 'fixed'::text CHECK (pricing_type = ANY (ARRAY['fixed'::text, 'hourly'::text, 'half_day'::text, 'full_day'::text, 'per_person'::text, 'custom'::text])),
  duration_hours numeric,
  max_people integer,
  includes ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pricing_grid_pkey PRIMARY KEY (id),
  CONSTRAINT pricing_grid_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT pricing_grid_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid,
  viewer_id uuid,
  viewed_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT profile_views_pkey PRIMARY KEY (id),
  CONSTRAINT profile_views_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id),
  CONSTRAINT profile_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.users(id)
);
CREATE TABLE public.provider_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  activity_type text CHECK (activity_type = ANY (ARRAY['certification'::text, 'training'::text, 'event'::text, 'collaboration'::text, 'award'::text, 'other'::text])),
  date_start date,
  date_end date,
  organization text,
  document_url text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT provider_activities_pkey PRIMARY KEY (id),
  CONSTRAINT provider_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.provider_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid UNIQUE,
  total_orders integer DEFAULT 0,
  completed_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  profile_views_count integer DEFAULT 0,
  response_rate numeric DEFAULT 0,
  avg_response_time_hours numeric,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT provider_stats_pkey PRIMARY KEY (id),
  CONSTRAINT provider_stats_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric NOT NULL,
  pricing_type text DEFAULT 'fixed'::text CHECK (pricing_type = ANY (ARRAY['fixed'::text, 'hourly'::text, 'daily'::text, 'project'::text])),
  duration_minutes integer,
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  profile_photo_url text,
  city text NOT NULL,
  neighborhood text NOT NULL,
  employment_status text DEFAULT 'unemployed'::text CHECK (employment_status = ANY (ARRAY['employed'::text, 'unemployed'::text, 'self_employed'::text, 'student'::text])),
  role text DEFAULT 'client'::text CHECK (role = ANY (ARRAY['client'::text, 'prestataire'::text, 'admin'::text])),
  domain_expertise ARRAY,
  education text,
  side_activities text,
  bio text,
  is_verified boolean DEFAULT false,
  verification_status text DEFAULT 'none'::text CHECK (verification_status = ANY (ARRAY['none'::text, 'pending'::text, 'verified'::text, 'rejected'::text])),
  id_document_url text,
  id_document_type text CHECK (id_document_type = ANY (ARRAY['cni'::text, 'passport'::text, 'permit'::text, 'other'::text])),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'banned'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.verification_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  document_type text CHECK (document_type = ANY (ARRAY['cni'::text, 'passport'::text, 'permit'::text, 'other'::text])),
  document_url text NOT NULL,
  document_status text DEFAULT 'pending'::text CHECK (document_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewer_notes text,
  CONSTRAINT verification_documents_pkey PRIMARY KEY (id),
  CONSTRAINT verification_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);