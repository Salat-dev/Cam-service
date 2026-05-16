// ═══════════════════════════════════════════
// SERVICES.JS — Complet et à jour
// ═══════════════════════════════════════════

const SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const INITIAL_COUNT = 12;
var allServices = [];
var filteredServices = [];
var showAll = false;
var currentSort = 'recent';

var categoryEmojis = {
    'Plomberie':'🔧','Électricité':'⚡','Ménage':'🏠','Photographie':'📸',
    'Développement web':'💻','Cours particuliers':'📚','Transport':'🚗',
    'Design':'🎨','Beauté':'💄','Bâtiment':'🏗️'
};

// ═══════════════ INIT ═══════════════
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    updateNavCartCount();
    loadAllServices();

    var urlCat = new URLSearchParams(window.location.search).get('cat');
    if (urlCat) {
        var catFilter = document.getElementById('categoryFilter');
        if (catFilter) {
            setTimeout(function() {
                catFilter.value = urlCat;
                handleSearch();
            }, 1500);
        }
    }
});

// ═══════════════ CHARGER LES SERVICES ═══════════════
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
        var grid = document.getElementById('servicesGrid');
        if (grid) {
            grid.innerHTML = '<div class="empty-state"><i data-lucide="alert-triangle" style="width:3rem;height:3rem"></i><h3>Erreur de chargement</h3><p>' + escapeHtml(err.message) + '</p></div>';
        }
        lucide.createIcons();
    }
}

// ═══════════════ REMPLIR LES FILTRES ═══════════════
function populateFilters() {
    var cats = [...new Set(allServices.map(function(s) { return s.category; }).filter(Boolean))].sort();
    var cities = [...new Set(allServices.map(function(s) { return s.provider.city; }).filter(Boolean))].sort();

    var catSelect = document.getElementById('categoryFilter');
    if (catSelect) {
        cats.forEach(function(c) {
            var o = document.createElement('option');
            o.value = c; o.textContent = c;
            catSelect.appendChild(o);
        });
    }

    var citySelect = document.getElementById('cityFilter');
    if (citySelect) {
        cities.forEach(function(c) {
            var o = document.createElement('option');
            o.value = c; o.textContent = c;
            citySelect.appendChild(o);
        });
    }
}

// ═══════════════ RECHERCHE & FILTRES ═══════════════
function handleSearch() {
    var q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    var cat = document.getElementById('categoryFilter')?.value || 'all';
    var city = document.getElementById('cityFilter')?.value || 'all';

    filteredServices = allServices.filter(function(s) {
        var matchQ = !q || 
            (s.title || '').toLowerCase().includes(q) || 
            (s.description || '').toLowerCase().includes(q) || 
            (s.provider?.full_name || '').toLowerCase().includes(q);
        var matchCat = cat === 'all' || cat === '' || s.category === cat;
        var matchCity = city === 'all' || city === '' || (s.provider?.city || '') === city;
        return matchQ && matchCat && matchCity;
    });

    sortServices();
    showAll = false;
    renderServices();
}

// ═══════════════ TRI ═══════════════
function setSort(type) {
    document.querySelectorAll('.sort-btn').forEach(function(b) { b.classList.remove('active'); });
    var sortMap = { recent:'sortRecent', price_asc:'sortPriceAsc', price_desc:'sortPriceDesc', alpha:'sortAlpha' };
    var btn = document.getElementById(sortMap[type]);
    if (btn) btn.classList.add('active');
    currentSort = type;
    sortServices();
    renderServices();
}

function sortServices() {
    filteredServices.sort(function(a, b) {
        if (currentSort === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (currentSort === 'price_desc') return (b.price || 0) - (a.price || 0);
        if (currentSort === 'alpha') return (a.title || '').localeCompare(b.title || '');
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

// ═══════════════ RENDU DES SERVICES ═══════════════
function renderServices() {
    var grid = document.getElementById('servicesGrid');
    var wrap = document.getElementById('showMoreWrap');
    var count = document.getElementById('resultsCount');
    
    if (!grid) return;
    
    var list = showAll ? filteredServices : filteredServices.slice(0, INITIAL_COUNT);

    if (count) {
        count.innerHTML = '<strong>' + filteredServices.length + '</strong> service' + 
            (filteredServices.length > 1 ? 's' : '') + ' trouvé' + 
            (filteredServices.length > 1 ? 's' : '');
    }

    if (filteredServices.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i data-lucide="search-x" style="width:3rem;height:3rem"></i><h3>Aucun résultat</h3><p>Essayez avec d\'autres mots-clés ou filtres.</p></div>';
        if (wrap) wrap.style.display = 'none';
        lucide.createIcons();
        return;
    }

    grid.innerHTML = list.map(function(s, i) {
        var p = s.provider || {};
        var initials = (p.full_name || '?').split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase();
        var emoji = categoryEmojis[s.category] || '🛠️';
        var hasImage = s.image_url && s.image_url.trim().length > 0;

        return '<a href="service-detail.html?id=' + s.id + '" class="service-card" style="animation-delay:' + (i * .04) + 's">'
            + '<div class="card-image">'
            + (hasImage 
                ? '<img src="' + escapeHtml(s.image_url) + '" alt="' + escapeHtml(s.title) + '" loading="lazy" onerror="this.parentElement.classList.add(\'no-image\')">'
                : '')
            + '<span class="cat-emoji">' + emoji + '</span>'
            + '<span class="card-category">' + escapeHtml(s.category || 'Service') + '</span>'
            + '<span class="card-price">' + formatPrice(s.price) + '</span>'
            + '</div>'
            + '<div class="card-body">'
            + '<h3 class="card-title">' + escapeHtml(s.title) + '</h3>'
            + (s.description ? '<p class="card-desc">' + escapeHtml(s.description.substring(0, 120)) + '</p>' : '')
            + '</div>'
            + '<div class="card-footer">'
            + '<div class="card-provider">'
            + '<div class="card-avatar">' + (p.profile_photo_url ? '<img src="' + escapeHtml(p.profile_photo_url) + '" alt="" loading="lazy">' : initials) + '</div>'
            + '<div>'
            + '<div class="card-provider-name">' + escapeHtml(p.full_name || 'Prestataire') + '</div>'
            + '<div class="card-provider-loc"><i data-lucide="map-pin" style="width:.6rem;height:.6rem"></i> ' + escapeHtml(p.city || '') + '</div>'
            + '</div>'
            + '</div>'
            + (p.is_verified 
                ? '<span class="card-verified"><i data-lucide="shield-check" style="width:.65rem;height:.65rem"></i> Vérifié</span>' 
                : '<span class="card-cta">Voir <i data-lucide="arrow-right" style="width:.7rem;height:.7rem"></i></span>')
            + '</div>'
            + '</a>';
    }).join('');

    if (filteredServices.length > INITIAL_COUNT && !showAll) {
        if (wrap) wrap.style.display = 'block';
        var showMoreText = document.getElementById('showMoreText');
        if (showMoreText) showMoreText.textContent = 'Voir les ' + (filteredServices.length - INITIAL_COUNT) + ' autres services';
    } else {
        if (wrap) wrap.style.display = 'none';
    }

    lucide.createIcons();
}

function showAllServices() {
    showAll = true;
    renderServices();
    var wrap = document.getElementById('showMoreWrap');
    if (wrap) wrap.style.display = 'none';
}

// ═══════════════ TOAST ═══════════════
function showToast(msg, type) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var colors = { success:'#3D8B5E', error:'#DC2626', info:'#1A1714' };
    var icons  = { success:'check-circle', error:'x-circle', info:'info' };
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:13px 20px;border-radius:12px;font-weight:600;font-size:.82rem;box-shadow:0 8px 28px rgba(0,0,0,.18);display:flex;align-items:center;gap:10px;color:white;animation:toastUp .3s ease;font-family:Outfit,sans-serif';
    toast.style.background = colors[type] || colors.info;
    toast.innerHTML = '<i data-lucide="' + (icons[type] || 'info') + '" style="width:1.1rem;height:1.1rem;flex-shrink:0"></i> <span>' + msg + '</span>';
    document.body.appendChild(toast);
    lucide.createIcons();
    setTimeout(function() { 
        toast.style.opacity = '0'; 
        toast.style.transform = 'translateY(16px)'; 
        toast.style.transition = 'all .3s ease'; 
        setTimeout(function(){ toast.remove(); }, 300); 
    }, 3500);
}

// ═══════════════ PANIER ═══════════════
function updateNavCartCount() {
    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    var el = document.getElementById('cartCountNav');
    if (el) { 
        el.textContent = cart.length; 
        el.style.display = cart.length > 0 ? 'inline' : 'none'; 
    }
}

// ═══════════════ HELPERS ═══════════════
function escapeHtml(t) { 
    var d = document.createElement('div'); 
    d.textContent = t || ''; 
    return d.innerHTML; 
}

function formatPrice(p) { 
    if (p === null || p === undefined || isNaN(p)) return '—';
    return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'XAF', 
        maximumFractionDigits: 0 
    }).format(p); 
}

// ═══════════════ RACCOURCI CLAVIER ═══════════════
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        var searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
});