// ═══════════════════════════════════════════
// SERVICES.JS — CamServices
// Dépendance : config.js (supabase déjà initialisé)
// ═══════════════════════════════════════════

var _allServices = [];
var _currentSort = 'recent';

// ═══════════════ INIT ═══════════════
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    loadServices();
    
    // Événements
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('cityFilter').addEventListener('change', applyFilters);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    
    document.querySelectorAll('.sort-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            _currentSort = this.dataset.sort;
            applyFilters();
        });
    });
});

// ═══════════════ CHARGER LES SERVICES ═══════════════
async function loadServices() {
    try {
        var { data, error } = await supabase
            .from('services')
            .select('*, provider:user_id(id, full_name, city, neighborhood, profile_photo_url, is_verified)')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        _allServices = (data || []).filter(function(s) { return s.provider !== null; });
        applyFilters();
        
    } catch (err) {
        console.error('❌ Erreur chargement services:', err);
        document.getElementById('servicesGrid').innerHTML = 
            '<div class="empty-state"><i data-lucide="alert-triangle" style="width:3rem;height:3rem"></i><h3>Erreur</h3><p>' + err.message + '</p></div>';
        lucide.createIcons();
    }
}

// ═══════════════ APPLIQUER LES FILTRES ═══════════════
function applyFilters() {
    var search = document.getElementById('searchInput').value.toLowerCase().trim();
    var city = document.getElementById('cityFilter').value;
    var category = document.getElementById('categoryFilter').value;

    var filtered = _allServices.filter(function(s) {
        // Recherche textuelle
        if (search) {
            var txt = (s.title + ' ' + (s.description || '') + ' ' + (s.provider?.full_name || '')).toLowerCase();
            if (txt.indexOf(search) === -1) return false;
        }
        // Filtre ville
        if (city && s.provider?.city !== city) return false;
        // Filtre catégorie
        if (category && s.category !== category) return false;
        return true;
    });

    // Tri
    if (_currentSort === 'price_low') {
        filtered.sort(function(a, b) { return (a.price || 0) - (b.price || 0); });
    } else if (_currentSort === 'price_high') {
        filtered.sort(function(a, b) { return (b.price || 0) - (a.price || 0); });
    }
    // 'recent' = déjà trié par created_at DESC

    document.getElementById('resultsText').innerHTML = '<strong>' + filtered.length + '</strong> service(s) trouvé(s)';
    renderServices(filtered);
}

// ═══════════════ AFFICHER LES SERVICES ═══════════════
function renderServices(services) {
    var grid = document.getElementById('servicesGrid');

    if (services.length === 0) {
        grid.innerHTML = 
            '<div class="empty-state">' +
            '<i data-lucide="search-x" style="width:4rem;height:4rem"></i>' +
            '<h3>Aucun service trouvé</h3>' +
            '<p>Essayez de modifier vos filtres.</p>' +
            '</div>';
        lucide.createIcons();
        return;
    }

    var emojis = {
        'Plomberie': '🔧', 'Électricité': '⚡', 'Ménage': '🏠',
        'Photographie': '📸', 'Développement web': '💻', 'Cours particuliers': '📚',
        'Transport': '🚗', 'Design': '🎨', 'Beauté': '💄', 'Bâtiment': '🏗️'
    };

    var html = '';
    for (var i = 0; i < services.length; i++) {
        var s = services[i];
        var p = s.provider || {};
        var initials = getInitials(p.full_name);
        var emoji = emojis[s.category] || '🛠️';
        var desc = s.description ? escapeHtml(s.description.substring(0, 100)) : '';

        html += '<a href="service-detail.html?id=' + s.id + '" class="service-card">';
        
        // Image
        html += '<div class="card-image">';
        html += '<span class="cat-emoji">' + emoji + '</span>';
        html += '<span class="card-category">' + escapeHtml(s.category || 'Service') + '</span>';
        html += '<span class="card-price">' + formatPrice(s.price) + '</span>';
        html += '</div>';
        
        // Body
        html += '<div class="card-body">';
        html += '<h3 class="card-title">' + escapeHtml(s.title) + '</h3>';
        if (desc) html += '<p class="card-desc">' + desc + '</p>';
        html += '<div class="card-tags">';
        html += '<span class="card-tag">' + formatPricingType(s.pricing_type) + '</span>';
        if (s.duration_minutes) {
            html += '<span class="card-tag">' + s.duration_minutes + ' min</span>';
        }
        html += '</div>';
        html += '</div>';
        
        // Footer
        html += '<div class="card-footer">';
        html += '<div class="card-provider">';
        html += '<div class="card-avatar">';
        if (p.profile_photo_url) {
            html += '<img src="' + p.profile_photo_url + '" alt="">';
        } else {
            html += initials;
        }
        html += '</div>';
        html += '<div>';
        html += '<div class="card-provider-name">' + escapeHtml(p.full_name || 'Inconnu');
        if (p.is_verified) {
            html += '<span class="verified-pin"><i data-lucide="check" style="width:.5rem;height:.5rem"></i></span>';
        }
        html += '</div>';
        html += '<div class="card-provider-city"><i data-lucide="map-pin" style="width:.6rem;height:.6rem"></i> ' + escapeHtml(p.city || '') + '</div>';
        html += '</div>';
        html += '</div>';
        html += '<i data-lucide="arrow-right" style="width:1.2rem;height:1.2rem;color:var(--faint)"></i>';
        html += '</div>';
        
        html += '</a>';
    }

    grid.innerHTML = html;
    lucide.createIcons();
}

// ═══════════════ HELPERS ═══════════════
function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0
    }).format(price || 0);
}

function formatPricingType(type) {
    var map = { fixed: 'Prix fixe', hourly: 'Horaire', daily: 'Journalier', project: 'Par projet' };
    return map[type] || type;
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase();
}

// Mettre à jour le compteur du panier dans la navbar
function updateNavCartCount() {
    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    var el = document.getElementById('cartCountNav');
    if (el) {
        el.textContent = cart.length;
        el.style.display = cart.length > 0 ? 'inline' : 'none';
    }
}
// Appeler au chargement
updateNavCartCount();