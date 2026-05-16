// ═══════════════════════════════════════════
// SERVICE-DETAIL.JS — CamServices
// Dépendance : config.js (supabase déjà initialisé)
// ═══════════════════════════════════════════

// Variables globales pour cette page
var _currentService = null;
var _currentProvider = null;
var _relatedServices = [];

// ═══════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    loadServiceDetail();
});

// ═══════════════════════════════════════════
// RÉCUPÉRER L'ID DU SERVICE DEPUIS L'URL
// ═══════════════════════════════════════════
function getServiceId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ═══════════════════════════════════════════
// CHARGER LES DÉTAILS DU SERVICE
// ═══════════════════════════════════════════
async function loadServiceDetail() {
    var serviceId = getServiceId();
    var container = document.getElementById('service-detail');

    if (!serviceId) {
        container.innerHTML = renderEmptyState('Aucun service spécifié.', 'search-x');
        return;
    }

    // État de chargement
    container.innerHTML = renderLoading();

    try {
        // Récupérer le service AVEC les infos du prestataire
        var { data: service, error } = await supabase
            .from('services')
            .select('*, provider:user_id(id, full_name, phone, email, city, neighborhood, profile_photo_url, is_verified, bio, domain_expertise)')
            .eq('id', serviceId)
            .single();

        if (error) throw error;
        if (!service) {
            container.innerHTML = renderEmptyState('Service introuvable.', 'package-x');
            return;
        }

        _currentService = service;
        _currentProvider = service.provider || {};

        // Enregistrer la vue du profil (si un utilisateur est connecté)
        recordProfileView();

        // Charger les services similaires
        await loadRelatedServices(service.category, service.id);

        // Afficher le détail
        renderServiceDetail();

    } catch (err) {
        console.error('❌ Erreur chargement service:', err);
        container.innerHTML = renderEmptyState('Erreur : ' + err.message, 'alert-triangle');
    }
}

// ═══════════════════════════════════════════
// ENREGISTRER UNE VUE DU PROFIL
// ═══════════════════════════════════════════
async function recordProfileView() {
    if (!_currentProvider.id) return;

    try {
        await supabase.from('profile_views').insert({
            provider_id: _currentProvider.id,
            viewer_id: null, // Peut être null pour les visiteurs anonymes
            user_agent: navigator.userAgent
        });
    } catch (err) {
        // Silencieux : ne pas bloquer l'utilisateur
        console.log('Vue profil non enregistrée');
    }
}

// ═══════════════════════════════════════════
// CHARGER LES SERVICES SIMILAIRES
// ═══════════════════════════════════════════
async function loadRelatedServices(category, currentServiceId) {
    try {
        var { data } = await supabase
            .from('services')
            .select('*, provider:user_id(id, full_name, city, profile_photo_url, is_verified)')
            .eq('category', category)
            .eq('is_active', true)
            .neq('id', currentServiceId)
            .limit(3);

        _relatedServices = (data || []).filter(function(s) { return s.provider !== null; });
    } catch (err) {
        _relatedServices = [];
    }
}

// ═══════════════════════════════════════════
// AFFICHER LE DÉTAIL DU SERVICE
// ═══════════════════════════════════════════
function renderServiceDetail() {
    var container = document.getElementById('service-detail');
    var s = _currentService;
    var p = _currentProvider;

    var phone = (p.phone || '').replace(/\s+/g, '').replace('+', '');
    var whatsappUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Bonjour, je suis intéressé par votre service "' + s.title + '" sur CamServices.');

    var initials = (p.full_name || '?').split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase();
    
    var categoryEmojis = {
        'Plomberie': '🔧', 'Électricité': '⚡', 'Ménage': '🏠', 'Photographie': '📸',
        'Développement web': '💻', 'Cours particuliers': '📚', 'Transport': '🚗',
        'Design': '🎨', 'Beauté': '💄', 'Bâtiment': '🏗️'
    };

    var html = '';

    // ═══ HERO SERVICE ═══
    html += '<section class="detail-hero">';
    html += '<div class="detail-hero-inner">';
    
    // Fil d'Ariane
    html += '<div class="breadcrumb">';
    html += '<a href="landing.html">Accueil</a> <span>/</span> ';
    html += '<a href="services.html">Services</a> <span>/</span> ';
    html += '<span>' + escapeHtml(s.title) + '</span>';
    html += '</div>';

    // Titre + catégorie
    html += '<div class="detail-header">';
    html += '<div class="detail-category-badge">' + (categoryEmojis[s.category] || '🛠️') + ' ' + escapeHtml(s.category || 'Service') + '</div>';
    html += '<h1 class="detail-title">' + escapeHtml(s.title) + '</h1>';
    html += '<div class="detail-price">' + formatPrice(s.price) + ' <span class="price-type">' + formatPricingType(s.pricing_type) + '</span></div>';
    html += '</div>';

    html += '</div>';
    html += '</section>';

    // ═══ CONTENU PRINCIPAL ═══
    html += '<div class="detail-layout">';
    
    // Colonne gauche
    html += '<div class="detail-main">';
    
    // Description
    html += '<div class="detail-card">';
    html += '<h2 class="detail-section-title"><i data-lucide="file-text"></i> Description</h2>';
    html += '<div class="detail-description">' + escapeHtml(s.description || 'Aucune description fournie pour ce service.') + '</div>';
    
    // Info tarification
    html += '<div class="detail-info-row">';
    html += '<div class="detail-info-item">';
    html += '<span class="detail-info-label">Type de prix</span>';
    html += '<span class="detail-info-value">' + formatPricingType(s.pricing_type) + '</span>';
    html += '</div>';
    if (s.duration_minutes) {
        html += '<div class="detail-info-item">';
        html += '<span class="detail-info-label">Durée estimée</span>';
        html += '<span class="detail-info-value">' + s.duration_minutes + ' Heures</span>';
        html += '</div>';
    }
    html += '<div class="detail-info-item">';
    html += '<span class="detail-info-label">Statut</span>';
    html += '<span class="detail-info-value"><span class="status-badge ' + (s.is_active ? 'status-active' : 'status-inactive') + '">' + (s.is_active ? 'Disponible' : 'Indisponible') + '</span></span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Prestataire
    html += '<div class="detail-card">';
    html += '<h2 class="detail-section-title"><i data-lucide="user-circle"></i> Prestataire</h2>';
    html += '<div class="provider-profile">';
    html += '<div class="provider-avatar-large">';
    if (p.profile_photo_url) {
        html += '<img src="' + p.profile_photo_url + '" alt="' + escapeHtml(p.full_name) + '">';
    } else {
        html += '<span class="provider-avatar-initials">' + initials + '</span>';
    }
    html += '</div>';
    html += '<div class="provider-details">';
    html += '<h3 class="provider-name">' + escapeHtml(p.full_name || 'Inconnu') + '';
    if (p.is_verified) {
        html += '<span class="verified-badge"><i data-lucide="shield-check"></i> Vérifié</span>';
    }
    html += '</h3>';
    if (p.city) {
        html += '<p class="provider-location"><i data-lucide="map-pin"></i> ' + escapeHtml(p.city) + (p.neighborhood ? ', ' + escapeHtml(p.neighborhood) : '') + '</p>';
    }
    if (p.bio) {
        html += '<p class="provider-bio">' + escapeHtml(p.bio) + '</p>';
    }
    if (p.domain_expertise && p.domain_expertise.length > 0) {
        html += '<div class="expertise-tags">';
        for (var i = 0; i < p.domain_expertise.length; i++) {
            html += '<span class="expertise-tag">' + escapeHtml(p.domain_expertise[i]) + '</span>';
        }
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '</div>';

    // Colonne droite (sidebar)
    html += '<div class="detail-sidebar">';
    
    // Carte d'action
    html += '<div class="sidebar-card action-card">';
    html += '<div class="action-price">' + formatPrice(s.price) + '</div>';
    html += '<button class="btn btn-dark btn-block" onclick="handleAddToCart()">';
    html += '<i data-lucide="shopping-cart"></i> Ajouter au panier';
    html += '</button>';
    if (phone) {
        html += '<a href="' + whatsappUrl + '" target="_blank" class="btn btn-whatsapp btn-block">';
        html += '<i data-lucide="message-circle"></i> Contacter via WhatsApp';
        html += '</a>';
    }
    if (p.email) {
        html += '<a href="mailto:' + escapeHtml(p.email) + '" class="btn btn-ghost btn-block">';
        html += '<i data-lucide="mail"></i> Envoyer un email';
        html += '</a>';
    }
    html += '</div>';

    // Services similaires
    if (_relatedServices.length > 0) {
        html += '<div class="sidebar-card">';
        html += '<h3 class="sidebar-card-title">Services similaires</h3>';
        for (var j = 0; j < _relatedServices.length; j++) {
            var rs = _relatedServices[j];
            var rp = rs.provider || {};
            html += '<a href="service-detail.html?id=' + rs.id + '" class="related-service-item">';
            html += '<div>';
            html += '<div class="related-service-title">' + escapeHtml(rs.title) + '</div>';
            html += '<div class="related-service-price">' + formatPrice(rs.price) + '</div>';
            html += '</div>';
            html += '<i data-lucide="arrow-right" style="width:1rem;height:1rem;color:var(--faint)"></i>';
            html += '</a>';
        }
        html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
    lucide.createIcons();
}

// ═══════════════════════════════════════════
// AJOUT AU PANIER
// ═══════════════════════════════════════════
async function handleAddToCart() {
    // Vérifier si l'utilisateur est connecté
    var { data } = await supabase.auth.getSession();
    
    if (!data.session) {
        showToast('Veuillez vous connecter pour ajouter au panier.', 'info');
        setTimeout(function() {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    if (!_currentService) {
        showToast('Service non disponible.', 'error');
        return;
    }

    // Récupérer le panier existant du localStorage
    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    
    // Vérifier si le service est déjà dans le panier
    var exists = false;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].serviceId === _currentService.id) {
            exists = true;
            break;
        }
    }

    if (exists) {
        showToast('Ce service est déjà dans votre panier.', 'info');
        return;
    }

    // Ajouter au panier
    cart.push({
        serviceId: _currentService.id,
        title: _currentService.title,
        price: _currentService.price,
        providerName: _currentProvider.full_name || 'Inconnu',
        providerId: _currentProvider.id,
        addedAt: new Date().toISOString()
    });

    localStorage.setItem('camservices_cart', JSON.stringify(cart));
    showToast('✅ Service ajouté au panier !', 'success');
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0
    }).format(price || 0);
}

function formatPricingType(type) {
    var map = {
        fixed: 'Prix fixe',
        hourly: 'Taux horaire',
        daily: 'À la journée',
        project: 'Par projet'
    };
    return map[type] || type;
}

function showToast(msg, type) {
    var existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    var colors = { success: '#3D8B5E', error: '#DC2626', info: '#1A1714' };
    var icons = { success: 'check-circle', error: 'x-circle', info: 'info' };

    var toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:' + (colors[type] || colors.info) + ';color:white;padding:14px 22px;border-radius:12px;font-weight:600;font-size:.85rem;box-shadow:0 8px 32px rgba(0,0,0,.2);display:flex;align-items:center;gap:10px;font-family:Outfit,sans-serif;animation:toastUp .3s ease';
    toast.innerHTML = '<i data-lucide="' + (icons[type] || 'info') + '" style="width:1.2rem;height:1.2rem"></i> ' + msg;
    document.body.appendChild(toast);
    lucide.createIcons();

    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all .3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
}

function renderLoading() {
    return '<div style="text-align:center;padding:80px"><div class="spinner" style="width:32px;height:32px;border:2.5px solid #E8E2DA;border-top-color:#C4943E;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 16px"></div><p style="color:#8A8279">Chargement du service...</p></div>';
}

function renderEmptyState(msg, icon) {
    return '<div style="text-align:center;padding:80px"><i data-lucide="' + (icon || 'search-x') + '" style="width:4rem;height:4rem;color:#C9C2B8;margin-bottom:12px"></i><p style="color:#8A8279">' + msg + '</p><a href="services.html" style="display:inline-flex;align-items:center;gap:6px;margin-top:16px;padding:10px 20px;background:#1A1714;color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:.85rem"><i data-lucide="arrow-left" style="width:1rem;height:1rem"></i> Retour aux services</a></div>';
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