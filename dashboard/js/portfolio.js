// ============================================================
//  PORTFOLIO — Script complet et autonome
//  Table : public.portfolio_items
// ============================================================

// ─────────────────────────────────────────────────────────────
//  A. SUPABASE INIT
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

let currentUser    = null;
let portfolioItems = [];
let currentFilter  = 'all';

// ─────────────────────────────────────────────────────────────
//  B. AUTH + SIDEBAR
// ─────────────────────────────────────────────────────────────
async function initDashboard() {
    const { data: { user: authUser } } = await sb.auth.getUser();
    if (!authUser) { window.location.href = '../login.html'; return; }

    const { data: profile } = await sb
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

    currentUser = profile || {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: 'prestataire',
        is_verified: false,
        profile_photo_url: null
    };

    // Sidebar
    const nameEl   = document.getElementById('sidebarName');
    const roleEl   = document.getElementById('sidebarRole');
    const avatarEl = document.getElementById('sidebarAvatar');
    const badgeEl  = document.getElementById('verifyBadge');

    if (nameEl)  nameEl.textContent = currentUser.full_name || currentUser.email;
    if (roleEl)  roleEl.textContent = ({ client:'Client', prestataire:'Prestataire', admin:'Admin' })[currentUser.role] || 'Prestataire';
    if (badgeEl) badgeEl.style.display = currentUser.is_verified ? 'inline-flex' : 'none';
    if (avatarEl) {
        if (currentUser.profile_photo_url) {
            avatarEl.style.backgroundImage = `url(${currentUser.profile_photo_url})`;
            avatarEl.style.backgroundSize  = 'cover';
        } else {
            avatarEl.textContent = (currentUser.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
        }
    }

    // Badges sidebar
    const { count: svcCount } = await sb.from('services').select('id', { count:'exact', head:true }).eq('user_id', currentUser.id);
    const { count: ordCount } = await sb.from('orders').select('id', { count:'exact', head:true }).eq('provider_id', currentUser.id).in('status', ['pending','confirmed','in_progress']);
    const svcBadge = document.getElementById('serviceBadge');
    const ordBadge = document.getElementById('orderBadge');
    if (svcBadge) svcBadge.textContent = svcCount || 0;
    if (ordBadge) ordBadge.textContent = ordCount || 0;

    lucide.createIcons();
}

function setActiveNav(page) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const el = document.getElementById('nav-' + page);
    if (el) el.classList.add('active');
}

function toggleSidebar() {
    const s = document.getElementById('sidebar');
    if (s) s.classList.toggle('open');
}

async function logout() {
    await sb.auth.signOut();
    window.location.href = '../landing.html';
}

// ─────────────────────────────────────────────────────────────
//  C. REQUÊTE SUPABASE — portfolio_items
// ─────────────────────────────────────────────────────────────
async function getPortfolioItems() {
    if (!currentUser) return [];
    const { data, error } = await sb
        .from('portfolio_items')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) { console.error('getPortfolioItems:', error); return []; }
    return data || [];
}

// ─────────────────────────────────────────────────────────────
//  D. HELPERS
// ─────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ─────────────────────────────────────────────────────────────
//  E. TOAST
// ─────────────────────────────────────────────────────────────
(function(){
    const s = document.createElement('style');
    s.textContent = '@keyframes slideInR{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(s);
})();

function showToast(message, type = 'info') {
    let w = document.getElementById('_tw');
    if (!w) {
        w = document.createElement('div');
        w.id = '_tw';
        w.style.cssText = 'position:fixed;top:24px;right:24px;z-index:10000;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(w);
    }
    const icons  = { success:'check-circle', error:'alert-circle', info:'info', warning:'alert-triangle' };
    const colors = { success:'var(--green)', error:'var(--red)', info:'var(--gold)', warning:'#F59E0B' };
    const t = document.createElement('div');
    t.style.cssText = `display:flex;align-items:center;gap:10px;padding:14px 20px;background:var(--white);border:1px solid var(--rule);border-radius:var(--radius);box-shadow:var(--shadow-lg);font-size:.85rem;font-family:var(--ff-body);color:var(--ink);pointer-events:auto;min-width:280px;animation:slideInR .3s ease;border-left:4px solid ${colors[type]};`;
    t.innerHTML = `<i data-lucide="${icons[type]}" style="width:1.1rem;height:1.1rem;color:${colors[type]};flex-shrink:0"></i><span style="flex:1">${message}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:0"><i data-lucide="x" style="width:.9rem;height:.9rem"></i></button>`;
    w.appendChild(t);
    lucide.createIcons();
    setTimeout(() => { t.style.transition='opacity .3s,transform .3s'; t.style.opacity='0'; t.style.transform='translateX(20px)'; setTimeout(()=>t.remove(),300); }, 4000);
}

// ─────────────────────────────────────────────────────────────
//  F. MODAL + CONFIRM
// ─────────────────────────────────────────────────────────────
function openModal(htmlContent) {
    const c = document.getElementById('modalContainer');
    if (!c) return;
    c.innerHTML = `<div class="modal-overlay" onclick="closeModal()"><div class="modal-content" onclick="event.stopPropagation()">${htmlContent}</div></div>`;
    c.style.display = 'block';
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeModal() {
    const c = document.getElementById('modalContainer');
    if (c) { c.innerHTML = ''; c.style.display = 'none'; }
    document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function confirmAction(message) {
    return new Promise(resolve => {
        openModal(`
            <div class="modal-header">
                <h3 class="modal-title"><i data-lucide="alert-triangle" style="width:1.2rem;height:1.2rem;color:var(--red)"></i> Confirmation</h3>
                <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
            </div>
            <p style="padding:20px 24px;font-size:.9rem;color:var(--ink-2)">${message}</p>
            <div class="form-actions" style="padding:0 24px 24px;gap:12px">
                <button class="btn btn-secondary" id="confirmNo">Annuler</button>
                <button class="btn btn-primary" style="background:var(--red)" id="confirmYes"><i data-lucide="trash-2" style="width:.9rem;height:.9rem"></i> Confirmer</button>
            </div>
        `);
        document.getElementById('confirmYes').onclick = () => { closeModal(); resolve(true); };
        document.getElementById('confirmNo').onclick  = () => { closeModal(); resolve(false); };
    });
}

// ─────────────────────────────────────────────────────────────
//  G. STATS + FILTRE
// ─────────────────────────────────────────────────────────────
function updateStats() {
    const total    = portfolioItems.length;
    const featured = portfolioItems.filter(p => p.is_featured).length;
    const cats     = [...new Set(portfolioItems.map(p => p.category).filter(Boolean))];
    const now      = new Date();
    const monthly  = portfolioItems.filter(p => {
        const d = new Date(p.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    document.getElementById('totalItems').textContent    = total;
    document.getElementById('featuredCount').textContent  = featured;
    document.getElementById('categoryCount').textContent  = cats.length;
    document.getElementById('recentCount').textContent    = monthly.length;
}

function updateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    const cats   = [...new Set(portfolioItems.map(p => p.category).filter(Boolean))];
    select.innerHTML = '<option value="all">Toutes les catégories</option>' +
        cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function filterPortfolio() {
    currentFilter = document.getElementById('categoryFilter').value;
    renderPortfolio();
}

// ─────────────────────────────────────────────────────────────
//  H. RENDU GRILLE
// ─────────────────────────────────────────────────────────────
function renderPortfolio() {
    const container = document.getElementById('portfolioGrid');
    const filtered = currentFilter === 'all'
        ? portfolioItems
        : portfolioItems.filter(p => p.category === currentFilter);

    if (portfolioItems.length === 0) {
        container.innerHTML = `
            <div class="portfolio-empty">
                <div class="portfolio-empty-icon">
                    <i data-lucide="camera" style="width:2.5rem;height:2.5rem"></i>
                </div>
                <h3>Votre portfolio est vide</h3>
                <p>Ajoutez des photos de vos réalisations pour montrer votre savoir-faire et attirer plus de clients.</p>
                <div class="portfolio-empty-suggestions">
                    <div class="portfolio-empty-suggestion">
                        <i data-lucide="sparkles" style="width:2rem;height:2rem"></i>
                        <span>Avant / Après</span>
                    </div>
                    <div class="portfolio-empty-suggestion">
                        <i data-lucide="camera" style="width:2rem;height:2rem"></i>
                        <span>Projets terminés</span>
                    </div>
                    <div class="portfolio-empty-suggestion">
                        <i data-lucide="video" style="width:2rem;height:2rem"></i>
                        <span>Vidéos démo</span>
                    </div>
                </div>
                <a href="portfolio-registration.html" class="btn btn-primary">
                    <i data-lucide="plus"></i> Ajouter ma première réalisation
                </a>
            </div>`;
        lucide.createIcons();
        return;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="portfolio-empty">
                <i data-lucide="search" style="width:3rem;height:3rem;color:var(--faint);margin-bottom:12px"></i>
                <h3>Aucun résultat</h3>
                <p>Aucune réalisation dans la catégorie "${escapeHtml(currentFilter)}".</p>
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('categoryFilter').value='all';filterPortfolio()">Voir tout</button>
            </div>`;
        lucide.createIcons();
        return;
    }

    container.innerHTML = `
        <div class="portfolio-masonry">
            ${filtered.map((p, index) => `
                <div class="portfolio-card ${p.is_featured ? 'featured' : ''}" style="animation-delay:${index * 0.05}s">
                    <div class="portfolio-image-wrapper">
                        ${p.media_type === 'video' ? `
                            <div class="portfolio-video-overlay">
                                <i data-lucide="play" style="width:2.5rem;height:2.5rem;fill:white;color:white"></i>
                            </div>
                        ` : ''}
                        <img src="${escapeHtml(p.media_url)}" 
                             alt="${escapeHtml(p.title)}" 
                             loading="lazy"
                             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect fill=%22%23E8E2DA%22 width=%22400%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23C9C2B8%22 font-size=%2214%22>Image</text></svg>'">
                    </div>
                    
                    ${p.is_featured ? `
                        <div class="portfolio-featured-badge">
                            <i data-lucide="star" style="width:.7rem;height:.7rem;fill:white"></i> Vedette
                        </div>
                    ` : ''}
                    
                    <div class="portfolio-card-body">
                        <h3 class="portfolio-card-title">${escapeHtml(p.title)}</h3>
                        ${p.category ? `<span class="portfolio-category"><i data-lucide="folder" style="width:.7rem;height:.7rem"></i> ${escapeHtml(p.category)}</span>` : ''}
                        ${p.description ? `<p class="portfolio-card-desc">${escapeHtml(p.description)}</p>` : ''}
                        ${p.tags && p.tags.length ? `
                            <div class="portfolio-tags">
                                ${p.tags.map(t => `<span class="portfolio-tag">#${escapeHtml(t)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="portfolio-card-footer">
                        <span style="font-size:.7rem;color:var(--faint)">
                            <i data-lucide="calendar" style="width:.7rem;height:.7rem;vertical-align:middle;margin-right:4px"></i>
                            ${formatDate(p.created_at)}
                        </span>
                        <div class="action-group">
                            <button class="btn-icon" onclick="openPortfolioModal('${p.id}')" title="Modifier">
                                <i data-lucide="pencil" style="width:.9rem;height:.9rem"></i>
                            </button>
                            <button class="btn-icon" onclick="toggleFeatured('${p.id}')" title="${p.is_featured ? 'Retirer des vedettes' : 'Mettre en vedette'}">
                                <i data-lucide="star" style="width:.9rem;height:.9rem;${p.is_featured ? 'fill:var(--gold);color:var(--gold)' : ''}"></i>
                            </button>
                            <button class="btn-icon danger" onclick="deletePortfolioItem('${p.id}')" title="Supprimer">
                                <i data-lucide="trash-2" style="width:.9rem;height:.9rem"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>`;
    lucide.createIcons();
}

// ─────────────────────────────────────────────────────────────
//  I. MODAL CRUD — CRÉER / MODIFIER une réalisation
// ─────────────────────────────────────────────────────────────
async function openPortfolioModal(id = null) {
    const isEdit = !!id;
    let item = {
        title: '', description: '', media_url: '', media_type: 'image',
        category: '', tags: [], is_featured: false, display_order: portfolioItems.length
    };

    if (isEdit) {
        const found = portfolioItems.find(p => p.id === id);
        if (found) item = { ...item, ...found };
    }

    const tagsString  = (item.tags || []).join(', ');
    const categories  = [...new Set(portfolioItems.map(p => p.category).filter(Boolean))];

    const html = `
        <div class="modal-header">
            <h3 class="modal-title">
                <i data-lucide="${isEdit ? 'pencil' : 'camera'}" style="width:1.2rem;height:1.2rem"></i>
                ${isEdit ? 'Modifier la réalisation' : 'Nouvelle réalisation'}
            </h3>
            <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="portfolioForm">
            <input type="hidden" name="id" value="${id || ''}">
            <input type="hidden" name="media_type" value="${item.media_type || 'image'}">
            <input type="hidden" name="display_order" value="${item.display_order || 0}">

            <div class="form-group">
                <label>Titre de la réalisation *</label>
                <input type="text" name="title" value="${escapeHtml(item.title)}" placeholder="Ex: Maquillage mariage traditionnel" required>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Catégorie</label>
                    <input type="text" name="category" value="${escapeHtml(item.category || '')}" placeholder="Ex: Mariage, Beauté, Événementiel" list="categoriesList">
                    <datalist id="categoriesList">
                        ${categories.map(c => `<option value="${escapeHtml(c)}">`).join('')}
                    </datalist>
                </div>
                <div class="form-group">
                    <label>Type de média</label>
                    <select name="media_type_select" onchange="document.querySelector('[name=media_type]').value=this.value">
                        <option value="image" ${item.media_type === 'image' ? 'selected' : ''}>Image / Photo</option>
                        <option value="video" ${item.media_type === 'video' ? 'selected' : ''}>Vidéo</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label>URL du média *</label>
                <input type="url" name="media_url" value="${escapeHtml(item.media_url || '')}" placeholder="https://exemple.com/photo.jpg" required>
                <span style="font-size:.7rem;color:var(--muted);margin-top:4px;display:block">Collez l'URL de votre image ou vidéo hébergée en ligne</span>
                ${item.media_url ? `<div style="margin-top:10px;border-radius:var(--radius);overflow:hidden;background:var(--cream);max-width:200px"><img src="${escapeHtml(item.media_url)}" alt="Aperçu" style="width:100%;max-height:120px;object-fit:cover" onerror="this.style.display='none'"></div>` : ''}
            </div>

            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="3" placeholder="Décrivez cette réalisation, le contexte, le client...">${escapeHtml(item.description || '')}</textarea>
            </div>

            <div class="form-group">
                <label>Tags <span style="font-weight:400;color:var(--muted);font-size:.7rem">(séparés par des virgules)</span></label>
                <input type="text" name="tags" value="${escapeHtml(tagsString)}" placeholder="Ex: maquillage, mariage, yaoundé, pro">
            </div>

            <div class="form-group">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                    <input type="checkbox" name="is_featured" ${item.is_featured ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--gold);cursor:pointer">
                    Mettre en vedette
                </label>
                <span style="font-size:.72rem;color:var(--muted);margin-left:26px">Les réalisations en vedette apparaissent en premier et ont un badge "Vedette"</span>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">
                    <i data-lucide="save"></i> ${isEdit ? 'Enregistrer' : 'Ajouter au portfolio'}
                </button>
            </div>
        </form>
    `;

    openModal(html);

    // ── SUBMIT : INSERT ou UPDATE dans portfolio_items ────────
    document.getElementById('portfolioForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const fd   = new FormData(this);
        const data = Object.fromEntries(fd.entries());

        // Nettoyage pour correspondre au schéma portfolio_items
        data.tags = data.tags
            ? data.tags.split(',').map(t => t.trim()).filter(t => t)
            : [];

        data.media_type    = data.media_type || 'image';
        data.is_featured   = data.is_featured === 'on';
        data.display_order = parseInt(data.display_order) || 0;
        data.description   = data.description.trim() || null;
        data.category      = data.category.trim() || null;
        data.media_url     = data.media_url.trim();
        data.title         = data.title.trim();

        // Supprimer les champs qui ne vont pas dans la BD
        delete data.id;
        delete data.media_type_select;

        try {
            if (isEdit) {
                // ── UPDATE ──
                const { error } = await sb.from('portfolio_items').update(data).eq('id', id);
                if (error) throw error;
                showToast('Réalisation mise à jour', 'success');
            } else {
                // ── INSERT ──
                data.user_id = currentUser.id;
                const { error } = await sb.from('portfolio_items').insert([data]);
                if (error) throw error;
                showToast('Réalisation ajoutée au portfolio', 'success');
            }

            closeModal();
            portfolioItems = await getPortfolioItems();
            updateStats();
            updateCategoryFilter();
            renderPortfolio();

        } catch (err) {
            console.error('Erreur portfolio_items :', err);
            if (err.code === '23503') {
                showToast("Erreur de profil utilisateur. Complétez votre inscription d'abord.", 'error');
            } else if (err.code === '23514') {
                showToast('Le type de média doit être "image" ou "video".', 'error');
            } else {
                showToast('Erreur : ' + (err.message || 'Réessayez.'), 'error');
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────
//  J. TOGGLE VEDETTE
// ─────────────────────────────────────────────────────────────
async function toggleFeatured(id) {
    const item = portfolioItems.find(p => p.id === id);
    if (!item) return;

    const newStatus = !item.is_featured;

    try {
        const { error } = await sb.from('portfolio_items').update({ is_featured: newStatus }).eq('id', id);
        if (error) throw error;
        portfolioItems = await getPortfolioItems();
        updateStats();
        renderPortfolio();
        showToast(newStatus ? 'Ajouté aux vedettes' : 'Retiré des vedettes', 'info');
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    }
}

// ─────────────────────────────────────────────────────────────
//  K. SUPPRIMER
// ─────────────────────────────────────────────────────────────
async function deletePortfolioItem(id) {
    const item = portfolioItems.find(p => p.id === id);
    if (!item) return;

    const ok = await confirmAction(`Supprimer définitivement "${item.title}" de votre portfolio ?`);
    if (!ok) return;

    try {
        const { error } = await sb.from('portfolio_items').delete().eq('id', id);
        if (error) throw error;
        portfolioItems = await getPortfolioItems();
        updateStats();
        updateCategoryFilter();
        renderPortfolio();
        showToast('Réalisation supprimée', 'info');
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    }
}

// ─────────────────────────────────────────────────────────────
//  L. DÉMARRAGE
// ─────────────────────────────────────────────────────────────
async function loadPortfolio() {
    await initDashboard();
    setActiveNav('portfolio');
    portfolioItems = await getPortfolioItems();
    updateStats();
    updateCategoryFilter();
    renderPortfolio();
}

loadPortfolio();