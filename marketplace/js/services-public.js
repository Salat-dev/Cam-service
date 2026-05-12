/**
 * ═══════════════════════════════════════════════════════════════
 *  CamServices — services-public.js
 *  Backend de la page publique "Trouver un service"
 *
 *  Dépendances (à charger AVANT ce fichier dans le HTML) :
 *    1. https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
 *    2. config.js  →  expose window.supabase (le client Supabase)
 * ═══════════════════════════════════════════════════════════════
 */

/* ─────────────────────────────────────────────
   ÉTAT GLOBAL
───────────────────────────────────────────── */
let allServices      = [];   // tous les services chargés
let filteredServices = [];   // résultats après filtrage
let currentSort      = 'recent';
let currentPage      = 1;
const PER_PAGE       = 12;

/* ─────────────────────────────────────────────
   ICÔNES PAR CATÉGORIE
───────────────────────────────────────────── */
const CATEGORY_ICONS = {
  'Plomberie':         '<i class="fas fa-faucet"></i>',
  'Électricité':       '<i class="fas fa-bolt"></i>',
  'Ménage':            '<i class="fas fa-house"></i>',
  'Photographie':      '<i class="fas fa-camera"></i>',
  'Développement web': '<i class="fas fa-code"></i>',
  'Cours particuliers':'<i class="fas fa-book-open"></i>',
  'Transport':         '<i class="fas fa-car-side"></i>',
  'Design':            '<i class="fas fa-palette"></i>',
  'Beauté':            '<i class="fas fa-spa"></i>',
  'Bâtiment':          '<i class="fas fa-hard-hat"></i>',
  'Jardinage':         '<i class="fas fa-leaf"></i>',
  'Informatique':      '<i class="fas fa-desktop"></i>',
  'Cuisine':           '<i class="fas fa-utensils"></i>',
  'Santé':             '<i class="fas fa-heartbeat"></i>',
  'Événementiel':      '<i class="fas fa-calendar-star"></i>',
};

/* ═══════════════════════════════════════════
   POINT D'ENTRÉE
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    updateNavbar(),
    loadServices(),
  ]);

  /* Touche Entrée dans la barre de recherche */
  document.getElementById('heroSearchInput')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilters(); });

  if (window.lucide) lucide.createIcons();
});

/* ═══════════════════════════════════════════
   NAVBAR ADAPTATIVE (connecté vs anonyme)
═══════════════════════════════════════════ */
async function updateNavbar() {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return; /* navbar par défaut déjà dans le HTML */

    /* Récupérer le rôle pour pointer vers le bon dashboard */
    const { data: profile } = await window.supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    const dashHref = profile?.role === 'prestataire'
      ? 'dashboard/index.html'
      : 'dashboard/client.html';

    const firstName = (profile?.full_name || '').split(' ')[0];

    navLinks.innerHTML = `
      <a href="services.html">Explorer</a>
      <a href="${dashHref}" style="font-weight:600;color:var(--ink)">
        <i data-lucide="layout-dashboard" style="width:.85rem;height:.85rem;vertical-align:middle;margin-right:4px"></i>
        ${escHtml(firstName) || 'Mon espace'}
      </a>
      <button onclick="logout()" style="background:none;border:1.5px solid var(--rule);padding:8px 18px;border-radius:var(--radius);font-family:var(--ff-body);font-size:.83rem;font-weight:500;color:var(--muted);cursor:pointer">
        Déconnexion
      </button>`;

    if (window.lucide) lucide.createIcons();
  } catch (_) { /* anonyme — navbar HTML par défaut */ }
}

async function logout() {
  await window.supabase.auth.signOut();
  window.location.href = 'landing.html';
}

/* ═══════════════════════════════════════════
   CHARGEMENT DES SERVICES
═══════════════════════════════════════════ */
async function loadServices() {
  showLoadingGrid();

  try {
    /*
     * On joint :
     *  - le prestataire (users) via user_id
     *  - les stats du prestataire (provider_stats) pour le tri "Populaires"
     *
     * Supabase supporte les alias de FK :
     *   provider:user_id(...)
     *
     * Si vous avez activé les politiques RLS côté Supabase,
     * assurez-vous que la table `services` est lisible publiquement
     * pour les lignes is_active = true.
     */
    const { data: services, error } = await window.supabase
      .from('services')
      .select(`
        id,
        title,
        description,
        category,
        price,
        pricing_type,
        duration_minutes,
        image_url,
        created_at,
        provider:user_id (
          id,
          full_name,
          city,
          neighborhood,
          profile_photo_url,
          is_verified,
          domain_expertise,
          stats:provider_stats (
            total_orders,
            completed_orders,
            average_rating,
            total_reviews,
            profile_views_count
          )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    /* Filtrer les services dont le prestataire est null / supprimé */
    allServices = (services || []).filter(s => s.provider !== null);

    updateHeroStats();
    applyFilters();

  } catch (err) {
    console.error('[services-public] loadServices:', err);
    document.getElementById('servicesGrid').innerHTML = `
      <div class="empty-results">
        <i data-lucide="alert-triangle" style="width:4rem;height:4rem"></i>
        <h3>Impossible de charger les services</h3>
        <p>${escHtml(err.message ?? 'Erreur réseau. Veuillez réessayer.')}</p>
        <button onclick="loadServices()"
                style="margin-top:16px;padding:10px 22px;background:var(--ink);color:var(--white);
                       border:none;border-radius:var(--radius);font-family:var(--ff-body);
                       font-weight:600;cursor:pointer">
          Réessayer
        </button>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }
}

/* ── Stats Hero ── */
function updateHeroStats() {
  const totalServices   = allServices.length;
  const uniqueProviders = new Set(
    allServices.map(s => s.provider?.id).filter(Boolean)
  ).size;

  animateCounter('totalServicesHero',   totalServices);
  animateCounter('totalProvidersHero',  uniqueProviders);
}

/* Compte à rebours animé */
function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 800;
  const step     = Math.ceil(target / (duration / 16));
  let current    = 0;
  const timer    = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 16);
}

/* ═══════════════════════════════════════════
   FILTRES
═══════════════════════════════════════════ */
function applyFilters() {
  const query    = (document.getElementById('heroSearchInput')?.value  ?? '').toLowerCase().trim();
  const city     = document.getElementById('heroCityFilter')?.value    ?? '';
  const category = document.getElementById('heroCategoryFilter')?.value ?? '';

  filteredServices = allServices.filter(service => {
    /* Recherche textuelle multi-champs */
    if (query) {
      const haystack = [
        service.title        ?? '',
        service.description  ?? '',
        service.category     ?? '',
        service.provider?.full_name ?? '',
        ...(service.provider?.domain_expertise ?? []),
      ].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    /* Ville du prestataire */
    if (city && service.provider?.city !== city) return false;

    /* Catégorie */
    if (category && service.category !== category) return false;

    return true;
  });

  sortServices();
  currentPage = 1;
  updateResultsCount();
  renderServices();
}

/* ─── Reset complet ─── */
function resetFilters() {
  const searchInput    = document.getElementById('heroSearchInput');
  const cityFilter     = document.getElementById('heroCityFilter');
  const categoryFilter = document.getElementById('heroCategoryFilter');
  if (searchInput)    searchInput.value    = '';
  if (cityFilter)     cityFilter.value     = '';
  if (categoryFilter) categoryFilter.value = '';
  applyFilters();
}

/* ═══════════════════════════════════════════
   TRI
═══════════════════════════════════════════ */
function setSort(sortType) {
  currentSort = sortType;

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === sortType);
  });

  sortServices();
  currentPage = 1;
  renderServices();
}

function sortServices() {
  switch (currentSort) {

    case 'price_low':
      filteredServices.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      break;

    case 'price_high':
      filteredServices.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      break;

    case 'popular':
      /*
       * Tri par score de popularité composé :
       *   50% commandes complétées + 30% note moyenne + 20% vues profil
       * Tout est ramené en valeur normalisée [0-1] par rapport au max.
       */
      const maxOrders = Math.max(...filteredServices.map(s =>
        s.provider?.stats?.[0]?.completed_orders ?? 0), 1);
      const maxRating = 5;
      const maxViews  = Math.max(...filteredServices.map(s =>
        s.provider?.stats?.[0]?.profile_views_count ?? 0), 1);

      filteredServices.sort((a, b) => {
        const sa = a.provider?.stats?.[0] ?? {};
        const sb = b.provider?.stats?.[0] ?? {};
        const scoreA = .5 * ((sa.completed_orders ?? 0) / maxOrders)
                     + .3 * ((sa.average_rating   ?? 0) / maxRating)
                     + .2 * ((sa.profile_views_count ?? 0) / maxViews);
        const scoreB = .5 * ((sb.completed_orders ?? 0) / maxOrders)
                     + .3 * ((sb.average_rating   ?? 0) / maxRating)
                     + .2 * ((sb.profile_views_count ?? 0) / maxViews);
        return scoreB - scoreA;
      });
      break;

    default: /* recent */
      filteredServices.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at));
  }
}

/* ═══════════════════════════════════════════
   AFFICHAGE
═══════════════════════════════════════════ */
function updateResultsCount() {
  const el = document.getElementById('resultsCount');
  if (!el) return;
  el.innerHTML = `<strong>${filteredServices.length}</strong> service(s) trouvé(s)`;
}

function renderServices() {
  const grid       = document.getElementById('servicesGrid');
  if (!grid) return;

  const totalPages  = Math.ceil(filteredServices.length / PER_PAGE);
  const start       = (currentPage - 1) * PER_PAGE;
  const pageItems   = filteredServices.slice(start, start + PER_PAGE);

  if (pageItems.length === 0) {
    grid.innerHTML = `
      <div class="empty-results">
        <i data-lucide="search-x" style="width:5rem;height:5rem"></i>
        <h3>Aucun service trouvé</h3>
        <p>Essayez de modifier votre recherche ou vos filtres.</p>
        <button onclick="resetFilters()"
                style="margin-top:16px;padding:10px 20px;border-radius:var(--radius);
                       font-weight:600;cursor:pointer;background:var(--ink);color:var(--white);
                       border:none;font-family:var(--ff-body);display:inline-flex;
                       align-items:center;gap:6px">
          <i data-lucide="rotate-ccw" style="width:.85rem;height:.85rem"></i>
          Réinitialiser les filtres
        </button>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
  } else {
    grid.innerHTML = pageItems.map(renderServiceCard).join('');
    renderPagination(totalPages);
  }

  if (window.lucide) lucide.createIcons();

  /* Scroll doux vers la grille si on change de page */
  if (currentPage > 1) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ─── Carte service ─── */
function renderServiceCard(service) {
  const provider = service.provider ?? {};
  const stats    = provider.stats?.[0] ?? {};

  /* Initiales avatar */
  const initials = (provider.full_name ?? '?')
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .substring(0, 2)
    .toUpperCase();

  /* Image / placeholder */
  const imageContent = service.image_url
    ? `<img src="${escHtml(service.image_url)}"
             alt="${escHtml(service.title)}"
             loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const placeholderStyle = service.image_url ? 'display:none' : '';
  const iconEmoji = CATEGORY_ICONS[service.category] ?? '🛠️';

  /* Avatar prestataire */
  const avatarContent = provider.profile_photo_url
    ? `<img src="${escHtml(provider.profile_photo_url)}" alt="">`
    : `<div class="provider-initials">${initials}</div>`;

  /* Badge vérifié */
  const verifiedBadge = provider.is_verified
    ? `<i data-lucide="shield-check" class="service-provider-verified"
           style="color:var(--gold);display:inline;vertical-align:middle;width:14px;height:14px"></i>`
    : '';

  /* Tags : type de tarif + expertises prestataire */
  const pricingTag = service.pricing_type
    ? `<span class="service-tag">${escHtml(formatPricingType(service.pricing_type))}</span>`
    : '';
  const expertiseTags = (provider.domain_expertise ?? [])
    .slice(0, 2)
    .map(d => `<span class="service-tag">${escHtml(d)}</span>`)
    .join('');

  /* Note (si disponible) */
  const ratingEl = stats.average_rating
    ? `<span style="font-size:.72rem;color:var(--gold);font-weight:600;display:inline-flex;align-items:center;gap:3px">
         <i data-lucide="star" style="width:.75rem;height:.75rem;fill:var(--gold)"></i>
         ${Number(stats.average_rating).toFixed(1)}
         <span style="color:var(--muted);font-weight:400">(${stats.total_reviews ?? 0})</span>
       </span>`
    : '';

  /* Durée */
  const durationEl = service.duration_minutes
    ? `<span style="font-size:.72rem;color:var(--muted);display:inline-flex;align-items:center;gap:3px">
         <i data-lucide="clock" style="width:.7rem;height:.7rem"></i>
         ${formatDuration(service.duration_minutes)}
       </span>`
    : '';

  return `
  <a href="service-detail.html?id=${escHtml(service.id)}" class="service-card">
    <div class="service-card-image">
      ${imageContent}
      <div class="service-card-image-placeholder" style="${placeholderStyle}">
        ${iconEmoji}
      </div>
      <span class="service-card-category">${escHtml(service.category ?? 'Service')}</span>
      <span class="service-card-price-badge">${formatPrice(service.price)}</span>
    </div>

    <div class="service-card-body">
      <h3 class="service-card-title">${escHtml(service.title)}</h3>
      ${service.description
        ? `<p class="service-card-description">${escHtml(service.description)}</p>`
        : ''}
      <div class="service-card-tags">
        ${pricingTag}
        ${expertiseTags}
      </div>
      ${ratingEl || durationEl
        ? `<div style="display:flex;align-items:center;gap:10px;margin-top:4px">
             ${ratingEl} ${durationEl}
           </div>`
        : ''}
    </div>

    <div class="service-card-footer">
      <div class="service-provider">
        <div class="service-provider-avatar">${avatarContent}</div>
        <div>
          <div class="service-provider-name">
            ${escHtml(provider.full_name ?? 'Prestataire')} ${verifiedBadge}
          </div>
          <div class="service-provider-location">
            <i data-lucide="map-pin" style="width:.6rem;height:.6rem"></i>
            ${escHtml(provider.city ?? '')}${provider.neighborhood
              ? ' · ' + escHtml(provider.neighborhood)
              : ''}
          </div>
        </div>
      </div>
      <i data-lucide="arrow-right"
         style="width:1.2rem;height:1.2rem;color:var(--faint);flex-shrink:0"></i>
    </div>
  </a>`;
}

/* ─── Loading skeleton ─── */
function showLoadingGrid() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="loading-grid">
      <div class="spinner"></div>
      <p>Chargement des services...</p>
    </div>`;
}

/* ═══════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════ */
function renderPagination(totalPages) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = '';

  /* Précédent */
  html += `<button ${currentPage === 1 ? 'disabled' : ''}
                   onclick="goToPage(${currentPage - 1})">
             <i data-lucide="chevron-left" style="width:1rem;height:1rem"></i>
           </button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
      html += `<button class="${i === currentPage ? 'active' : ''}"
                       onclick="goToPage(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<button disabled>…</button>`;
    }
  }

  /* Suivant */
  html += `<button ${currentPage === totalPages ? 'disabled' : ''}
                   onclick="goToPage(${currentPage + 1})">
             <i data-lucide="chevron-right" style="width:1rem;height:1rem"></i>
           </button>`;

  pagination.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function goToPage(page) {
  currentPage = page;
  renderServices();
  document.querySelector('.main-content')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ═══════════════════════════════════════════
   UTILITAIRES
═══════════════════════════════════════════ */
function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style:                'currency',
    currency:             'XAF',
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

function formatPricingType(type) {
  const map = {
    fixed:   'Prix fixe',
    hourly:  'Taux horaire',
    daily:   'À la journée',
    project: 'Par projet',
  };
  return map[type] ?? type;
}

function formatDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─────────────────────────────────────────────
   Exposer les fonctions appelées en inline HTML
───────────────────────────────────────────── */
window.applyFilters  = applyFilters;
window.resetFilters  = resetFilters;
window.setSort       = setSort;
window.goToPage      = goToPage;
window.logout        = logout;