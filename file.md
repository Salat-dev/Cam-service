<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trouver un Service — CamServices</title>
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
            --blue:#3B82F6;--blue-light:#EFF6FF;
   --ff-body: 'Inter', sans-serif;
    --ff-heading: 'Outfit', sans-serif;            --ease:cubic-bezier(.22,1,.36,1);
            --radius:10px;--radius-lg:16px;--radius-xl:20px;
            --shadow:0 4px 20px rgba(26,23,20,.06);
            --shadow-lg:0 12px 40px rgba(26,23,20,.1);
            --max:1260px;
        }
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:var(--ff-body);background:var(--cream);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased;line-height:1.6;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4;transform:scale(1.5)}}
        @keyframes toastUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes modalFadeIn{from{opacity:0}to{opacity:1}}

        /* ═══ NAVBAR ═══ */
        .navbar{position:sticky;top:0;z-index:50;background:rgba(250,248,245,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--rule);padding:0 32px;}
        .navbar-inner{max-width:var(--max);margin:0 auto;height:64px;display:flex;align-items:center;justify-content:space-between;}
        .nav-logo{font-weight:700;font-size:1.1rem;color:var(--ink);text-decoration:none;letter-spacing:-.02em;}
        .nav-logo .script{font-family:var(--ff-script);font-size:1.9rem;color:var(--gold);position:relative;top:3px;}
        .nav-links{display:flex;align-items:center;gap:20px;}
        .nav-links a{font-size:.85rem;font-weight:500;color:var(--muted);text-decoration:none;transition:color .2s;}
        .nav-links a:hover{color:var(--ink);}
        .nav-links a.active{color:var(--ink);font-weight:600;}
        .btn-nav{background:var(--ink);color:var(--white)!important;padding:8px 18px;border-radius:var(--radius);font-weight:600!important;position:relative;}
        .btn-nav:hover{background:var(--ink-2)!important;}
        .cart-badge{background:var(--gold);color:var(--white);font-size:.6rem;font-weight:700;padding:2px 6px;border-radius:10px;position:absolute;top:-4px;right:-8px;}

        /* ═══ HERO ═══ */
        .hero{background:var(--white);border-bottom:1px solid var(--rule);padding:56px 32px;position:relative;overflow:hidden;}
        .hero::before{content:'';position:absolute;top:-80px;right:-60px;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,var(--gold-dim) 0%,transparent 70%);pointer-events:none;}
        .hero-inner{max-width:var(--max);margin:0 auto;position:relative;z-index:1;}
        .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:16px;}
        .hero-eyebrow .dot{width:6px;height:6px;background:var(--green);border-radius:50%;animation:pulse 2s infinite;}
        .hero h1{font-weight:800;font-size:clamp(2rem,4vw,2.8rem);letter-spacing:-.04em;margin-bottom:12px;}
        .hero h1 .script{font-family:var(--ff-script);font-size:1.6em;color:var(--gold);font-weight:400;}
        .hero p{font-size:.95rem;color:var(--muted);max-width:480px;}

        /* ═══ SEARCH ═══ */
        .search-section{max-width:var(--max);margin:-28px auto 0;padding:0 32px;position:relative;z-index:10;}
        .search-card{background:var(--white);border:1px solid var(--rule);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);padding:24px;}
        .search-row{display:flex;gap:12px;flex-wrap:wrap;}
        .search-input-wrap{flex:1;min-width:200px;position:relative;}
        .search-input-wrap input{width:100%;padding:12px 14px 12px 40px;border:1.5px solid var(--rule);border-radius:var(--radius);font-family:var(--ff-body);font-size:.88rem;color:var(--ink);outline:none;transition:all .2s;background:var(--white);}
        .search-input-wrap input:focus{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-dim);}
        .search-input-wrap input::placeholder{color:var(--faint);}
        .search-input-wrap .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--faint);}
        .search-select{padding:12px 40px 12px 14px;border:1.5px solid var(--rule);border-radius:var(--radius);font-family:var(--ff-body);font-size:.85rem;color:var(--muted);outline:none;cursor:pointer;background:var(--white);min-width:160px;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A8279' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;}
        .search-select:focus{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-dim);}
        .results-info{display:flex;align-items:center;justify-content:space-between;margin-top:16px;flex-wrap:wrap;gap:8px;}
        .results-count{font-size:.82rem;color:var(--muted);}
        .results-count strong{color:var(--ink);}
        .sort-btns{display:flex;gap:6px;flex-wrap:wrap;}
        .sort-btn{padding:6px 14px;border:1px solid var(--rule);border-radius:20px;font-family:var(--ff-body);font-size:.75rem;font-weight:500;color:var(--muted);cursor:pointer;background:var(--white);transition:all .2s;}
        .sort-btn:hover{border-color:var(--ink);color:var(--ink);}
        .sort-btn.active{background:var(--ink);color:var(--white);border-color:var(--ink);}

        /* ═══ GRID 4 COLONNES ═══ */
        .main-content{max-width:var(--max);margin:0 auto;padding:32px;}
        .services-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
        .service-card{background:var(--white);border:1px solid var(--rule);border-radius:var(--radius-lg);overflow:hidden;transition:all .3s var(--ease);display:flex;flex-direction:column;text-decoration:none;color:inherit;animation:fadeUp .5s var(--ease);}
        .service-card:hover{border-color:var(--gold);box-shadow:var(--shadow-lg);transform:translateY(-3px);}
        .card-image{height:140px;background:linear-gradient(135deg,var(--ink-2),var(--ink));display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
        .card-image img{width:100%;height:100%;object-fit:cover;}
        .card-image .cat-emoji{font-size:3.5rem;opacity:.15;}
        .card-category{position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:20px;font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;background:rgba(255,255,255,.9);color:var(--ink);backdrop-filter:blur(8px);}
        .card-price{position:absolute;top:10px;right:10px;background:var(--gold);color:var(--white);padding:5px 12px;border-radius:20px;font-weight:700;font-size:.78rem;box-shadow:0 4px 12px rgba(196,148,62,.3);}
        .card-body{padding:16px 18px;flex:1;}
        .card-title{font-weight:700;font-size:.92rem;letter-spacing:-.02em;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .card-desc{font-size:.78rem;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .card-footer{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1px solid var(--rule);}
        .card-provider{display:flex;align-items:center;gap:8px;}
        .card-avatar{width:30px;height:30px;border-radius:50%;background:var(--cream);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:var(--faint);}
        .card-avatar img{width:100%;height:100%;object-fit:cover;}
        .card-provider-name{font-size:.75rem;font-weight:600;color:var(--ink);}
        .card-provider-loc{font-size:.68rem;color:var(--faint);}
        .card-verified{display:inline-flex;align-items:center;gap:3px;font-size:.62rem;font-weight:600;color:var(--green);background:var(--green-light);padding:2px 7px;border-radius:10px;}
        .card-verified i{width:.6rem;height:.6rem;}
        .card-cta{display:flex;align-items:center;gap:4px;font-size:.72rem;font-weight:600;color:var(--gold);transition:gap .2s;}
        .service-card:hover .card-cta{gap:8px;}

        /* ═══ VOIR PLUS ═══ */
        .show-more-wrap{text-align:center;margin-top:36px;}
        .btn-show-more{display:inline-flex;align-items:center;gap:10px;padding:14px 36px;background:var(--white);border:2px solid var(--rule);border-radius:var(--radius-lg);font-family:var(--ff-body);font-size:.9rem;font-weight:700;color:var(--ink);cursor:pointer;transition:all .3s var(--ease);}
        .btn-show-more:hover{border-color:var(--gold);box-shadow:var(--shadow);transform:translateY(-2px);}
        .btn-show-more i{width:1.1rem;height:1.1rem;transition:transform .3s;}
        .btn-show-more:hover i{transform:translateY(3px);}

        /* ═══ EMPTY ═══ */
        .empty-state{text-align:center;padding:80px 32px;grid-column:1/-1;}
        .empty-state i{width:4rem;height:4rem;color:var(--faint);margin-bottom:16px;}

        /* ═══ FOOTER ═══ */
        .footer{background:var(--white);border-top:1px solid var(--rule);padding:40px 32px;margin-top:40px;}
        .footer-inner{max-width:var(--max);margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
        .footer-logo{font-weight:700;font-size:1rem;color:var(--ink);letter-spacing:-.02em;}
        .footer-logo .script{font-family:var(--ff-script);font-size:1.8rem;color:var(--gold);position:relative;top:3px;}
        .footer-text{font-size:.78rem;color:var(--faint);}

        /* ═══ RESPONSIVE ═══ */
        @media(max-width:1100px){.services-grid{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:800px){.services-grid{grid-template-columns:repeat(2,1fr);}.hero{padding:40px 20px;}.search-section{padding:0 20px;}.main-content{padding:24px 20px;}}
        @media(max-width:500px){.services-grid{grid-template-columns:1fr;}.navbar{padding:0 16px;}.nav-links{gap:12px;}.search-row{flex-direction:column;}}
    </style>
</head>
<body>

<!-- ═══ NAVBAR ═══ -->
<nav class="navbar">
    <div class="navbar-inner">
<a href="landing.html" class="nav-logo">
 <img src="../asset/logo camservices.svg" alt="CamServices" class="logo-img"></a>
        <div class="nav-links">
            <a href="services.html" class="active">Services</a>
            <a href="landing.html">Accueil</a>
             <a href="./cart.html" style="position:relative;display:flex;align-items:center;gap:6px">
        <i data-lucide="shopping-cart" style="width:1rem;height:1rem"></i> Panier
        <span id="cartCountNav" style="background:var(--gold);color:white;font-size:.65rem;font-weight:700;padding:2px 7px;border-radius:10px;display:none">0</span>
    </a>
        </div>
    </div>
</nav>

<!-- ═══ HERO ═══ -->
<section class="hero">
    <div class="hero-inner">
        <div class="hero-eyebrow"><span class="dot"></span> Marketplace de services</div>
        <h1>Trouvez le bon <span class="script">prestataire</span></h1>
        <p>Des professionnels vérifiés près de chez vous, prêts à intervenir pour tous vos besoins.</p>
    </div>
</section>

<!-- ═══ SEARCH ═══ -->
<section class="search-section">
    <div class="search-card">
        <div class="search-row">
            <div class="search-input-wrap">
                <i data-lucide="search" class="search-icon" style="width:1rem;height:1rem"></i>
                <input type="text" id="searchInput" placeholder="Rechercher un service, un prestataire..." oninput="handleSearch()">
            </div>
            <select class="search-select" id="categoryFilter" onchange="handleSearch()">
                <option value="all">Toutes les catégories</option>
            </select>
            <select class="search-select" id="cityFilter" onchange="handleSearch()">
                <option value="all">Toutes les villes</option>
            </select>
        </div>
        <div class="results-info">
            <div class="results-count" id="resultsCount">Chargement...</div>
            <div class="sort-btns">
                <button class="sort-btn active" onclick="setSort('recent')" id="sortRecent">Récents</button>
                <button class="sort-btn" onclick="setSort('price_asc')" id="sortPriceAsc">Prix ↑</button>
                <button class="sort-btn" onclick="setSort('price_desc')" id="sortPriceDesc">Prix ↓</button>
                <button class="sort-btn" onclick="setSort('alpha')" id="sortAlpha">A → Z</button>
            </div>
        </div>
    </div>
</section>

<!-- ═══ SERVICES GRID ═══ -->
<div class="main-content">
    <div class="services-grid" id="servicesGrid">
        <div class="empty-state">
            <div class="spinner" style="width:32px;height:32px;border:2.5px solid #E8E2DA;border-top-color:#C4943E;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 16px"></div>
            <p style="color:var(--muted)">Chargement des services...</p>
        </div>
    </div>

    <!-- Bouton Voir Plus -->
    <div class="show-more-wrap" id="showMoreWrap" style="display:none">
        <button class="btn-show-more" onclick="showAllServices()" id="showMoreBtn">
            <i data-lucide="chevron-down"></i>
            <span id="showMoreText">Voir plus</span>
        </button>
    </div>
</div>

<!-- ═══ FOOTER ═══ -->
<footer class="footer">
    <div class="footer-inner">
        <div class="footer-logo">Cam<span class="script">S</span>ervices</div>
        <div class="footer-text">© 2025 CamServices — Tous droits réservés</div>
    </div>
</footer>

<!-- ═══ SCRIPTS ═══ -->
 <script src="../js/global.js"></script>
<script>
// ============================================================
//  SERVICES PUBLIC PAGE — Liste tous les services
// ============================================================

const SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';


const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const INITIAL_COUNT = 12;  // 4 colonnes × 3 lignes
var allServices = [];
var filteredServices = [];
var showAll = false;
var currentSort = 'recent';

var categoryEmojis = {
    'Plomberie':'🔧','Électricité':'⚡','Ménage':'🏠','Photographie':'📸',
    'Développement web':'💻','Cours particuliers':'📚','Transport':'🚗',
    'Design':'🎨','Beauté':'💄','Bâtiment':'🏗️'
};

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    updateNavCartCount();
    loadAllServices();
});

// ═══ CHARGER TOUS LES SERVICES ═══
async function loadAllServices() {
    try {
        var { data, error } = await sb
            .from('services')
            .select('*, provider:user_id(id, full_name, city, neighborhood, profile_photo_url, is_verified)')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allServices = (data || []).filter(function(s) { return s.provider !== null; });
        populateFilters();
        handleSearch();

    } catch (err) {
        console.error('Erreur chargement services:', err);
        document.getElementById('servicesGrid').innerHTML = '<div class="empty-state"><i data-lucide="alert-triangle"></i><h3>Erreur de chargement</h3><p style="color:var(--muted)">' + err.message + '</p></div>';
        lucide.createIcons();
    }
}

// ═══ PEUPLER LES FILTRES ═══
function populateFilters() {
    var cats = [...new Set(allServices.map(function(s) { return s.category; }).filter(Boolean))].sort();
    var cities = [...new Set(allServices.map(function(s) { return s.provider && s.provider.city; }).filter(Boolean))].sort();

    var catSelect = document.getElementById('categoryFilter');
    catSelect.innerHTML = '<option value="all">Toutes les catégories</option>';
    cats.forEach(function(c) {
        catSelect.innerHTML += '<option value="' + c + '">' + (categoryEmojis[c] || '🛠️') + ' ' + c + '</option>';
    });

    var citySelect = document.getElementById('cityFilter');
    citySelect.innerHTML = '<option value="all">Toutes les villes</option>';
    cities.forEach(function(c) {
        citySelect.innerHTML += '<option value="' + c + '">' + c + '</option>';
    });
}

// ═══ RECHERCHE + FILTRE ═══
function handleSearch() {
    var query    = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    var category = document.getElementById('categoryFilter').value;
    var city     = document.getElementById('cityFilter').value;

    filteredServices = allServices.filter(function(s) {
        var p = s.provider || {};
        var matchQuery = !query
            || s.title.toLowerCase().indexOf(query) !== -1
            || (s.description || '').toLowerCase().indexOf(query) !== -1
            || (p.full_name || '').toLowerCase().indexOf(query) !== -1
            || (s.category || '').toLowerCase().indexOf(query) !== -1;
        var matchCat  = category === 'all' || s.category === category;
        var matchCity = city === 'all' || (p.city || '') === city;
        return matchQuery && matchCat && matchCity;
    });

    sortServices();
    showAll = false;
    renderServices();
}

// ═══ TRI ═══
function setSort(sort) {
    currentSort = sort;
    document.querySelectorAll('.sort-btn').forEach(function(b) { b.classList.remove('active'); });
    var btn = document.getElementById('sort' + ({ recent:'Recent', price_asc:'PriceAsc', price_desc:'PriceDesc', alpha:'Alpha' })[sort]);
    if (btn) btn.classList.add('active');
    sortServices();
    renderServices();
}

function sortServices() {
    filteredServices.sort(function(a, b) {
        switch (currentSort) {
            case 'price_asc':  return (a.price || 0) - (b.price || 0);
            case 'price_desc': return (b.price || 0) - (a.price || 0);
            case 'alpha':      return (a.title || '').localeCompare(b.title || '');
            default:           return new Date(b.created_at) - new Date(a.created_at);
        }
    });
}

// ═══ VOIR PLUS ═══
function showAllServices() {
    showAll = true;
    renderServices();
    // Scroll smooth vers les nouveaux résultats
    var grid = document.getElementById('servicesGrid');
    var cards = grid.querySelectorAll('.service-card');
    if (cards.length > INITIAL_COUNT) {
        cards[INITIAL_COUNT].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ═══ RENDER ═══
function renderServices() {
    var container = document.getElementById('servicesGrid');
    var showMoreWrap = document.getElementById('showMoreWrap');
    var showMoreBtn  = document.getElementById('showMoreBtn');
    var showMoreText = document.getElementById('showMoreText');
    var resultsCount = document.getElementById('resultsCount');

    resultsCount.innerHTML = '<strong>' + filteredServices.length + '</strong> service' + (filteredServices.length > 1 ? 's' : '') + ' trouvé' + (filteredServices.length > 1 ? 's' : '');

    if (filteredServices.length === 0) {
        container.innerHTML = '<div class="empty-state"><i data-lucide="search-x" style="width:4rem;height:4rem;color:var(--faint);margin-bottom:12px"></i><h3 style="margin-bottom:8px">Aucun service trouvé</h3><p style="color:var(--muted);font-size:.88rem">Essayez de modifier vos critères de recherche.</p><button onclick="resetFilters()" style="margin-top:16px;padding:10px 22px;background:var(--ink);color:var(--white);border:none;border-radius:var(--radius);font-family:var(--ff-body);font-weight:600;font-size:.82rem;cursor:pointer">Réinitialiser les filtres</button></div>';
        showMoreWrap.style.display = 'none';
        lucide.createIcons();
        return;
    }

    var visible = showAll ? filteredServices : filteredServices.slice(0, INITIAL_COUNT);
    var remaining = filteredServices.length - INITIAL_COUNT;

    container.innerHTML = visible.map(function(s, i) {
        var p = s.provider || {};
        var initials = (p.full_name || '?').split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase();
        var emoji = categoryEmojis[s.category] || '🛠️';

        return '<a href="service-detail.html?id=' + s.id + '" class="service-card" style="animation-delay:' + (i % 4) * 0.08 + 's">'
            + '<div class="card-image">'
            +   (s.image_url
                    ? '<img src="' + escapeHtml(s.image_url) + '" alt="' + escapeHtml(s.title) + '" loading="lazy" onerror="this.style.display=\'none\';this.parentElement.innerHTML+=\'<span class=card-image-fallback style=font-size:3.5rem;opacity:.15>' + emoji + '</span>\'">'
                    : '<span class="cat-emoji">' + emoji + '</span>')
            +   '<span class="card-category">' + emoji + ' ' + escapeHtml(s.category || 'Service') + '</span>'
            +   '<span class="card-price">' + formatPrice(s.price) + '</span>'
            + '</div>'
            + '<div class="card-body">'
            +   '<div class="card-title">' + escapeHtml(s.title) + '</div>'
            +   '<div class="card-desc">' + escapeHtml(s.description || 'Service professionnel disponible sur CamServices.') + '</div>'
            + '</div>'
            + '<div class="card-footer">'
            +   '<div class="card-provider">'
            +     '<div class="card-avatar">'
            +       (p.profile_photo_url ? '<img src="' + p.profile_photo_url + '" alt="">' : initials)
            +     '</div>'
            +     '<div>'
            +       '<div class="card-provider-name">' + escapeHtml(p.full_name || 'Prestataire') + '</div>'
            +       '<div class="card-provider-loc">' + escapeHtml(p.city || '') + '</div>'
            +     '</div>'
            +   '</div>'
            +   '<div>'
            +     (p.is_verified ? '<span class="card-verified"><i data-lucide="shield-check"></i> Vérifié</span>' : '')
            +     '<div class="card-cta">Voir <i data-lucide="arrow-right" style="width:.8rem;height:.8rem"></i></div>'
            +   '</div>'
            + '</div>'
            + '</a>';
    }).join('');

    // Bouton Voir Plus
    if (!showAll && remaining > 0) {
        showMoreWrap.style.display = 'block';
        showMoreText.textContent = 'Voir les ' + remaining + ' autre' + (remaining > 1 ? 's' : '') + ' service' + (remaining > 1 ? 's' : '');
    } else {
        showMoreWrap.style.display = 'none';
    }

    lucide.createIcons();
}

// ═══ RESET FILTRES ═══
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('cityFilter').value = 'all';
    handleSearch();
}

// ═══ HELPERS ═══
function escapeHtml(text) { var d = document.createElement('div'); d.textContent = text || ''; return d.innerHTML; }

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'XAF', maximumFractionDigits:0 }).format(price || 0);
}

// ═══ TOAST ═══
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

// ═══ PANIER (DRAWER) ═══
function updateNavCartCount() {
    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    var el = document.getElementById('cartCountNav');
    if (el) { el.textContent = cart.length; el.style.display = cart.length > 0 ? 'flex' : 'none'; }
}

function openCartDrawer() {
    var old = document.getElementById('cartDrawerOverlay');
    if (old) old.remove();

    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    var total = cart.reduce(function(sum, item) { return sum + (item.price || 0); }, 0);

    var overlay = document.createElement('div');
    overlay.id = 'cartDrawerOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(26,23,20,.4);backdrop-filter:blur(4px);animation:modalFadeIn .2s ease;';
    overlay.onclick = function(e) { if (e.target === overlay) closeCartDrawer(); };

    var h = '';
    h += '<div style="position:fixed;top:0;right:0;bottom:0;width:420px;max-width:100vw;background:var(--white);box-shadow:-8px 0 40px rgba(26,23,20,.15);display:flex;flex-direction:column;z-index:9501;animation:slideInRight .3s cubic-bezier(.22,1,.36,1)">';

    // Header
    h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--rule)">';
    h += '<h3 style="font-weight:700;font-size:1rem;display:flex;align-items:center;gap:8px"><i data-lucide="shopping-cart" style="width:1.1rem;height:1.1rem;color:var(--gold)"></i> Mon panier <span style="font-size:.75rem;font-weight:500;color:var(--muted)">(' + cart.length + ')</span></h3>';
    h += '<button onclick="closeCartDrawer()" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:6px"><i data-lucide="x" style="width:1.2rem;height:1.2rem"></i></button>';
    h += '</div>';

    // Body
    h += '<div style="flex:1;overflow-y:auto;padding:20px 24px">';
    if (cart.length === 0) {
        h += '<div style="text-align:center;padding:48px 0;color:var(--faint)"><i data-lucide="shopping-bag" style="width:3rem;height:3rem;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto"></i><p style="font-size:.88rem;font-weight:600;color:var(--muted);margin-bottom:4px">Votre panier est vide</p><p style="font-size:.78rem;color:var(--faint)">Parcourez les services et ajoutez-en</p></div>';
    } else {
        for (var i = 0; i < cart.length; i++) {
            var item = cart[i];
            h += '<div style="display:flex;gap:14px;align-items:flex-start;padding:16px 0;' + (i > 0 ? 'border-top:1px solid var(--rule)' : '') + '">';
            h += '<div style="width:44px;height:44px;border-radius:var(--radius);background:var(--gold-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i data-lucide="briefcase" style="width:1.1rem;height:1.1rem;color:var(--gold)"></i></div>';
            h += '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:.85rem;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(item.title) + '</div><div style="font-size:.75rem;color:var(--muted)">' + escapeHtml(item.providerName) + '</div><div style="font-weight:800;font-size:.88rem;color:var(--gold);margin-top:4px">' + formatPrice(item.price) + '</div></div>';
            h += '<button onclick="removeFromCart(\'' + item.serviceId + '\')" style="background:none;border:none;cursor:pointer;color:var(--faint);padding:4px" onmouseover="this.style.color=\'var(--red)\'" onmouseout="this.style.color=\'var(--faint)\'"><i data-lucide="trash-2" style="width:.9rem;height:.9rem"></i></button>';
            h += '</div>';
        }
    }
    h += '</div>';

    // Footer
    if (cart.length > 0) {
        h += '<div style="padding:20px 24px;border-top:1px solid var(--rule);background:var(--cream)">';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-size:.85rem;font-weight:600;color:var(--muted)">Total</span><span style="font-size:1.2rem;font-weight:800;color:var(--ink)">' + formatPrice(total) + '</span></div>';
        h += '<button onclick="handleCheckout()" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px;background:var(--ink);color:var(--white);border:none;border-radius:var(--radius);font-family:var(--ff-body);font-size:.85rem;font-weight:600;cursor:pointer;margin-bottom:8px"><i data-lucide="credit-card" style="width:1rem;height:1rem"></i> Passer commande</button>';
        h += '<button onclick="clearCart()" style="width:100%;padding:10px;background:none;border:1px solid var(--rule);border-radius:var(--radius);font-family:var(--ff-body);font-size:.78rem;font-weight:500;color:var(--muted);cursor:pointer">Vider le panier</button>';
        h += '</div>';
    }

    h += '</div>';
    overlay.innerHTML = h;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeCartDrawer() {
    var o = document.getElementById('cartDrawerOverlay');
    if (o) o.remove();
    document.body.style.overflow = '';
}

function removeFromCart(serviceId) {
    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    cart = cart.filter(function(item) { return item.serviceId !== serviceId; });
    localStorage.setItem('camservices_cart', JSON.stringify(cart));
    updateNavCartCount();
    openCartDrawer();
}

function clearCart() {
    localStorage.removeItem('camservices_cart');
    updateNavCartCount();
    openCartDrawer();
}

async function handleCheckout() {
    var { data } = await sb.auth.getSession();
    if (!data.session) {
        showToast('Connectez-vous pour passer commande.', 'info');
        localStorage.setItem('camservices_redirect', 'checkout');
        setTimeout(function() { window.location.href = 'login.html'; }, 1500);
        return;
    }
    closeCartDrawer();
    showToast('Redirection vers le paiement...', 'info');
    setTimeout(function() { window.location.href = 'checkout.html'; }, 800);
}
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