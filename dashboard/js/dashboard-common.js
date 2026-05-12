// ═══════════════════════════════════════════
// DASHBOARD COMMON - Fonctions partagées
// ═══════════════════════════════════════════

// État global
let currentUser = null;

// ─────────────────────────────────────────────────────────────────
// INIT — appelée UNE SEULE FOIS par chaque page
// (le DOMContentLoaded automatique a été supprimé volontairement)
// ─────────────────────────────────────────────────────────────────
async function initDashboard() {

    /* 1. Masquer immédiatement pour éviter le flash de contenu */
    document.documentElement.style.visibility = 'hidden';

    try {
        /* 2. getSession() lit localStorage → pas de requête réseau, instantané */
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            _redirectToLogin();
            return null;
        }

        /* 3. Récupérer le profil prestataire */
        currentUser = await _loadUserProfile(session.user);

        if (!currentUser) {
            _redirectToLogin();
            return null;
        }

        /* 4. Mettre à jour la sidebar */
        updateSidebar();
        lucide.createIcons();

        /* 5. Révéler la page */
        document.documentElement.style.visibility = 'visible';

        return currentUser;

    } catch (err) {
        console.error('[initDashboard] Erreur inattendue :', err);
        _redirectToLogin();
        return null;
    }
}

/* Redirige vers login sans laisser de retour arrière possible */
function _redirectToLogin() {
    document.documentElement.style.visibility = 'hidden';
    window.location.replace('../login.html');
}

/* Charge le profil depuis la table providers */
async function _loadUserProfile(authUser) {
    try {
        const { data, error } = await supabase
            .from('providers')          // ← adapte si ta table s'appelle autrement
            .select('*')
            .eq('user_id', authUser.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[_loadUserProfile]', error);
        }

        /* Fusionner auth user + données profil */
        return { ...authUser, ...(data || {}) };

    } catch (err) {
        console.error('[_loadUserProfile] Erreur :', err);
        /* Si la table n'existe pas encore, on renvoie au moins l'auth user */
        return authUser;
    }
}

// ─────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────
function updateSidebar() {
    if (!currentUser) return;

    const nameEl   = document.getElementById('sidebarName');
    const avatarEl = document.getElementById('sidebarAvatar');
    const roleEl   = document.getElementById('sidebarRole');

    if (nameEl) nameEl.textContent = currentUser.full_name || 'Utilisateur';
    if (roleEl) roleEl.textContent = currentUser.is_verified ? 'Prestataire vérifié' : 'Prestataire';

    if (avatarEl) {
        const initials = (currentUser.full_name || 'U')
            .split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        if (currentUser.profile_photo_url) {
            avatarEl.innerHTML = `<img src="${currentUser.profile_photo_url}" alt="${initials}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            avatarEl.textContent = initials;
            avatarEl.style.cssText = 'background:var(--ink);color:var(--white);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem';
        }
    }

    const verifyBadge = document.getElementById('verifyBadge');
    if (verifyBadge) verifyBadge.style.display = currentUser.is_verified ? 'inline-flex' : 'none';

    loadSidebarCounts();
}

async function loadSidebarCounts() {
    if (!currentUser) return;

    try {
        const [{ count: serviceCount }, { count: pendingCount }] = await Promise.all([
            supabase.from('services')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUser.id)
                .eq('is_active', true),
            supabase.from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('provider_id', currentUser.id)
                .eq('status', 'pending')
        ]);

        const serviceBadge = document.getElementById('serviceBadge');
        if (serviceBadge) serviceBadge.textContent = serviceCount || '0';

        const orderBadge = document.getElementById('orderBadge');
        if (orderBadge) {
            orderBadge.textContent   = pendingCount || '0';
            orderBadge.style.display = pendingCount > 0 ? 'inline' : 'none';
        }

    } catch (e) {
        console.error('[loadSidebarCounts]', e);
    }
}

function setActiveNav(page) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const el = document.getElementById(`nav-${page}`);
    if (el) el.classList.add('active');
}

function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
}

// ─────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────
async function logout() {
    await supabase.auth.signOut();
    window.location.replace('../landing.html');
}

// ─────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    document.querySelector('.toast')?.remove();

    const icons = { success: 'check-circle', error: 'x-circle', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i data-lucide="${icons[type] || 'info'}" style="width:1.2rem;height:1.2rem"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ─────────────────────────────────────────────────────────────────
// FORMATAGE
// ─────────────────────────────────────────────────────────────────
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency', currency: 'XAF', maximumFractionDigits: 0
    }).format(price || 0);
}

function formatStatus(status) {
    const map = {
        pending:     'En attente',
        confirmed:   'Confirmée',
        in_progress: 'En cours',
        completed:   'Terminée',
        cancelled:   'Annulée',
        deleted:     'Supprimée'
    };
    return map[status] || status;
}

function formatTimeAgo(dateString) {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60)      return "À l'instant";
    if (diff < 3600)    return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400)   return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 2592000) return `Il y a ${Math.floor(diff / 86400)} j`;
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}

// ─────────────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────────────
function openModal(html) {
    const container = document.getElementById('modalContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
            <div class="modal">${html}</div>
        </div>
    `;
    lucide.createIcons();
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const container = document.getElementById('modalContainer');
    if (container) container.innerHTML = '';
    document.body.style.overflow = '';
}

function confirmAction(message) {
    return new Promise((resolve) => {
        openModal(`
            <div class="modal-header">
                <h3 class="modal-title">Confirmation</h3>
                <button class="modal-close" onclick="closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <p style="margin-bottom:24px;color:var(--muted);font-size:.9rem">${message}</p>
            <div style="display:flex;gap:12px;justify-content:flex-end">
                <button class="btn btn-secondary" onclick="closeModal();window._confirmResult=false">Annuler</button>
                <button class="btn btn-primary" style="background:var(--red)" onclick="closeModal();window._confirmResult=true">Confirmer</button>
            </div>
        `);

        const poll = setInterval(() => {
            if (window._confirmResult !== undefined) {
                clearInterval(poll);
                resolve(window._confirmResult);
                delete window._confirmResult;
            }
        }, 100);
    });
}

// ─────────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────────
async function getProviderStats() {
    if (!currentUser) return {};
    const { data } = await supabase
        .from('provider_stats')
        .select('*')
        .eq('provider_id', currentUser.id)
        .single();
    return data || {};
}

async function getMyServices() {
    if (!currentUser) return [];
    const { data } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    return data || [];
}

async function getAllOrders() {
    if (!currentUser) return [];
    const { data } = await supabase
        .from('orders')
        .select('*, client:client_id(full_name), service:service_id(title)')
        .eq('provider_id', currentUser.id)
        .order('created_at', { ascending: false });

    return (data || []).map(o => ({
        ...o,
        client_name:   o.client?.full_name || 'Client inconnu',
        service_title: o.service?.title    || 'Service supprimé'
    }));
}

async function getPricingItems() {
    if (!currentUser) return [];
    const { data } = await supabase
        .from('pricing_grid')
        .select('*, service:service_id(title)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    return (data || []).map(p => ({ ...p, service_title: p.service?.title || '—' }));
}

async function getPortfolioItems() {
    if (!currentUser) return [];
    const { data } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('display_order', { ascending: true });
    return data || [];
}

async function getActivities() {
    if (!currentUser) return [];
    const { data } = await supabase
        .from('provider_activities')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    return data || [];
}

async function getProfileViews(days = 7) {
    if (!currentUser) return [];
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await supabase
        .from('profile_views')
        .select('*, viewer:viewer_id(full_name)')
        .eq('provider_id', currentUser.id)
        .gte('viewed_at', since.toISOString())
        .order('viewed_at', { ascending: false })
        .limit(20);

    return (data || []).map(v => ({
        ...v,
        viewer_name: v.viewer?.full_name || 'Visiteur anonyme'
    }));
}

// ── NOTE : le DOMContentLoaded automatique a été retiré intentionnellement.
// Chaque page appelle initDashboard() elle-même dans son propre script,
// ce qui évite la double exécution et les race conditions.