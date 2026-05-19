
// ─── A. SUPABASE ─────────────────────────────────────────────
const SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

let currentUser   = null;
let activities    = [];
let currentFilter = 'all';

// ═══ CONSTANTES DE COULEURS (Modern SaaS) ═══
const COLORS = {
    primary:      '#22C55E',
    primaryHover: '#16A34A',
    primaryLight: '#F0FDF4',
    primaryDim:   'rgba(34, 197, 94, 0.08)',
    accent:       '#F59E0B',
    accentHover:  '#D97706',
    accentLight:  '#FFFBEB',
    accentDim:    'rgba(245, 158, 11, 0.08)',
    blue:         '#3B82F6',
    blueLight:    '#EFF6FF',
    purple:       '#7C3AED',
    purpleLight:  '#F5F3FF',
    error:        '#EF4444',
    errorLight:   '#FEF2F2',
    textPrimary:  '#111827',
    textSecondary:'#4B5563',
    textMuted:    '#6B7280',
    border:       '#E5E7EB',
    borderLight:  '#F3F4F6',
    surface:      '#F9FAFB',
    white:        '#FFFFFF'
};

// ─── B. AUTH + SIDEBAR ───────────────────────────────────────
async function initDashboard() {
    const { data: { user: authUser } } = await sb.auth.getUser();
    if (!authUser) { window.location.href = '../login.html'; return; }

    const { data: profile } = await sb.from('users').select('*').eq('id', authUser.id).maybeSingle();

    currentUser = profile || {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: 'prestataire',
        is_verified: false,
        profile_photo_url: null
    };

    // Mise à jour du sidebar
    const nameEl = document.getElementById('sidebarName');
    const roleEl = document.getElementById('sidebarRole');
    const avatarEl = document.getElementById('sidebarAvatar');
    const badgeEl = document.getElementById('verifyBadge');

    if (nameEl)  nameEl.textContent = currentUser.full_name || currentUser.email;
    if (roleEl)  roleEl.textContent = ({ client:'Client', prestataire:'Prestataire', admin:'Admin' })[currentUser.role] || 'Prestataire';
    if (badgeEl) badgeEl.style.display = currentUser.is_verified ? 'inline-flex' : 'none';
    
    if (avatarEl) {
        avatarEl.textContent = ''; // Clear previous content
        if (currentUser.profile_photo_url) {
            avatarEl.innerHTML = `<img src="${currentUser.profile_photo_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            avatarEl.textContent = (currentUser.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
        }
    }

    // Compteurs sidebar
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

// ─── C. REQUÊTE SUPABASE — provider_activities ───────────────
async function getActivities() {
    if (!currentUser) return [];
    const { data, error } = await sb
        .from('provider_activities')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date_start', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('getActivities:', error);
        showToast('Erreur lors du chargement des activités', 'error');
        return [];
    }
    return data || [];
}

// ─── D. HELPERS ──────────────────────────────────────────────
function escapeHtml(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function formatDateRange(start, end) {
    if (!start) return '';
    const s = new Date(start).toLocaleDateString('fr-FR', { month:'short', year:'numeric' });
    if (!end) return s;
    const e = new Date(end).toLocaleDateString('fr-FR', { month:'short', year:'numeric' });
    return `${s} — ${e}`;
}

function getActivityTypeConfig(type) {
    const configs = {
        certification:  { icon:'certificate',    label:'Certification',  color: COLORS.accent,  bg: COLORS.accentLight },
        training:       { icon:'graduation-cap', label:'Formation',      color: COLORS.blue,    bg: COLORS.blueLight },
        event:          { icon:'calendar-check', label:'Événement',      color: COLORS.purple,  bg: COLORS.purpleLight },
        collaboration:  { icon:'users',          label:'Collaboration',  color: COLORS.primary, bg: COLORS.primaryLight },
        award:          { icon:'trophy',         label:'Récompense',     color: COLORS.accent,  bg: COLORS.accentLight },
        other:          { icon:'star',           label:'Autre',          color: COLORS.textMuted, bg: COLORS.surface }
    };
    return configs[type] || configs.other;
}

// ─── E. TOAST NOTIFICATIONS ──────────────────────────────────
function showToast(message, type = 'info') {
    let wrapper = document.getElementById('_tw');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = '_tw';
        wrapper.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(wrapper);
    }

    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        info: 'info',
        warning: 'alert-triangle'
    };

    const bgColors = {
        success: COLORS.primary,
        error: COLORS.error,
        info: COLORS.textPrimary,
        warning: COLORS.accent
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 20px;
        background: ${COLORS.white};
        border: 1px solid ${COLORS.borderLight};
        border-radius: 12px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
        font-size: 0.875rem;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: ${COLORS.textPrimary};
        pointer-events: auto;
        min-width: 300px;
        animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border-left: 4px solid ${bgColors[type] || COLORS.textPrimary};
    `;

    toast.innerHTML = `
        <i data-lucide="${icons[type] || 'info'}" style="width:1.125rem;height:1.125rem;color:${bgColors[type]};flex-shrink:0"></i>
        <span style="flex:1;font-weight:500">${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:${COLORS.textMuted};padding:4px;border-radius:6px;transition:all 0.2s" onmouseover="this.style.background='${COLORS.surface}'" onmouseout="this.style.background='none'">
            <i data-lucide="x" style="width:0.875rem;height:0.875rem"></i>
        </button>
    `;

    wrapper.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ═══ Ajout de l'animation toast ═══
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(40px); }
        to { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(toastStyle);

// ─── F. MODAL + CONFIRM ─────────────────────────────────────
function openModal(htmlContent) {
    const container = document.getElementById('modalContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                ${htmlContent}
            </div>
        </div>
    `;
    container.style.display = 'block';
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeModal() {
    const container = document.getElementById('modalContainer');
    if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
    }
    document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

function confirmAction(message) {
    return new Promise(resolve => {
        openModal(`
            <div class="modal-header">
                <h3 class="modal-title">
                    <i data-lucide="alert-triangle" style="width:1.25rem;height:1.25rem;color:${COLORS.error}"></i>
                    Confirmation
                </h3>
                <button class="modal-close" onclick="closeModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <p style="padding:24px 28px;font-size:0.9375rem;color:${COLORS.textSecondary};line-height:1.6">${message}</p>
            <div class="form-actions" style="padding:0 28px 28px;gap:12px">
                <button class="btn btn-secondary" id="confirmNo">Annuler</button>
                <button class="btn btn-primary" style="background:${COLORS.error}" id="confirmYes">
                    <i data-lucide="trash-2" style="width:1rem;height:1rem"></i> Confirmer
                </button>
            </div>
        `);
        
        document.getElementById('confirmYes').onclick = () => { closeModal(); resolve(true); };
        document.getElementById('confirmNo').onclick  = () => { closeModal(); resolve(false); };
    });
}

// ─── G. STATS + FILTRE ──────────────────────────────────────
function updateStats() {
    const now = new Date();
    document.getElementById('totalActivities').textContent   = activities.length;
    document.getElementById('certificationCount').textContent = activities.filter(a => a.activity_type === 'certification').length;
    document.getElementById('verifiedCount').textContent      = activities.filter(a => a.is_verified).length;
    document.getElementById('thisYearCount').textContent      = activities.filter(a => new Date(a.created_at).getFullYear() === now.getFullYear()).length;
}

function filterActivities() {
    currentFilter = document.getElementById('typeFilter').value;
    renderActivities();
}

// ─── H. RENDU ────────────────────────────────────────────────
function renderActivities() {
    const container = document.getElementById('activitiesList');
    const filtered = currentFilter === 'all' ? activities : activities.filter(a => a.activity_type === currentFilter);

    if (activities.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <div class="empty-icon"><i data-lucide="award"></i></div>
                    <h3>Aucune activité enregistrée</h3>
                    <p>Ajoutez vos certifications, formations et accomplissements pour renforcer votre crédibilité auprès des clients.</p>
                    <div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:28px">
                        <div style="text-align:center">
                            <div style="width:52px;height:52px;border-radius:50%;background:${COLORS.accentLight};display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
                                <i data-lucide="certificate" style="color:${COLORS.accent};width:1.25rem;height:1.25rem"></i>
                            </div>
                            <span style="font-size:0.8125rem;color:${COLORS.textMuted};font-weight:500">Certification</span>
                        </div>
                        <div style="text-align:center">
                            <div style="width:52px;height:52px;border-radius:50%;background:${COLORS.blueLight};display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
                                <i data-lucide="graduation-cap" style="color:${COLORS.blue};width:1.25rem;height:1.25rem"></i>
                            </div>
                            <span style="font-size:0.8125rem;color:${COLORS.textMuted};font-weight:500">Formation</span>
                        </div>
                        <div style="text-align:center">
                            <div style="width:52px;height:52px;border-radius:50%;background:${COLORS.purpleLight};display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
                                <i data-lucide="trophy" style="color:${COLORS.purple};width:1.25rem;height:1.25rem"></i>
                            </div>
                            <span style="font-size:0.8125rem;color:${COLORS.textMuted};font-weight:500">Récompense</span>
                        </div>
                        <div style="text-align:center">
                            <div style="width:52px;height:52px;border-radius:50%;background:${COLORS.primaryLight};display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
                                <i data-lucide="users" style="color:${COLORS.primary};width:1.25rem;height:1.25rem"></i>
                            </div>
                            <span style="font-size:0.8125rem;color:${COLORS.textMuted};font-weight:500">Collaboration</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="openActivityModal()">
                        <i data-lucide="plus"></i> Ajouter ma première activité
                    </button>
                </div>
            </div>`;
        lucide.createIcons();
        return;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <div class="empty-icon"><i data-lucide="filter"></i></div>
                    <h3>Aucune activité trouvée</h3>
                    <p>Aucune activité ne correspond au filtre sélectionné.</p>
                    <button class="btn btn-secondary" onclick="document.getElementById('typeFilter').value='all';filterActivities()">
                        <i data-lucide="list"></i> Afficher tout
                    </button>
                </div>
            </div>`;
        lucide.createIcons();
        return;
    }

    // Grouper par année
    const grouped = {};
    filtered.forEach(a => {
        const year = new Date(a.date_start || a.created_at).getFullYear();
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(a);
    });

    let html = '';
    Object.keys(grouped).sort((a,b) => b - a).forEach(year => {
        html += `
            <div style="margin-bottom:32px">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                    <h3 style="font-weight:700;font-size:1rem;color:${COLORS.textPrimary}">${year}</h3>
                    <span style="font-size:0.75rem;color:${COLORS.textMuted};background:${COLORS.surface};padding:4px 12px;border-radius:100px;font-weight:500">${grouped[year].length} activité(s)</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px">
                    ${grouped[year].map(a => renderActivityCard(a)).join('')}
                </div>
            </div>`;
    });

    container.innerHTML = html;
    lucide.createIcons();
}

function renderActivityCard(a) {
    const tc = getActivityTypeConfig(a.activity_type);
    return `
        <div class="card" style="margin-bottom:0">
            <div style="display:flex;gap:16px;align-items:flex-start">
                <div style="width:48px;height:48px;border-radius:12px;background:${tc.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i data-lucide="${tc.icon}" style="width:1.25rem;height:1.25rem;color:${tc.color}"></i>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
                        <div>
                            <h4 style="font-weight:700;font-size:0.9375rem;color:${COLORS.textPrimary};margin-bottom:4px">${escapeHtml(a.title)}</h4>
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                                <span style="font-size:0.75rem;font-weight:600;padding:4px 10px;border-radius:100px;background:${tc.bg};color:${tc.color}">${tc.label}</span>
                                ${a.organization ? `<span style="font-size:0.8125rem;color:${COLORS.textSecondary};display:flex;align-items:center;gap:4px"><i data-lucide="building-2" style="width:0.875rem;height:0.875rem"></i> ${escapeHtml(a.organization)}</span>` : ''}
                                ${a.date_start ? `<span style="font-size:0.8125rem;color:${COLORS.textMuted};display:flex;align-items:center;gap:4px"><i data-lucide="calendar" style="width:0.875rem;height:0.875rem"></i> ${formatDateRange(a.date_start, a.date_end)}</span>` : ''}
                                ${a.is_verified ? `<span style="font-size:0.6875rem;font-weight:600;padding:3px 10px;border-radius:100px;background:${COLORS.primaryLight};color:${COLORS.primary};display:flex;align-items:center;gap:4px"><i data-lucide="check-circle" style="width:0.75rem;height:0.75rem"></i> Vérifié</span>` : ''}
                            </div>
                        </div>
                        <div style="display:flex;gap:6px">
                            <button class="btn-icon" onclick="openActivityModal('${a.id}')" title="Modifier">
                                <i data-lucide="pencil" style="width:0.875rem;height:0.875rem"></i>
                            </button>
                            <button class="btn-icon danger" onclick="deleteActivity('${a.id}')" title="Supprimer">
                                <i data-lucide="trash-2" style="width:0.875rem;height:0.875rem"></i>
                            </button>
                        </div>
                    </div>
                    ${a.description ? `<p style="font-size:0.875rem;color:${COLORS.textSecondary};line-height:1.6;margin-top:12px">${escapeHtml(a.description)}</p>` : ''}
                    ${a.document_url ? `<a href="${escapeHtml(a.document_url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:0.8125rem;color:${COLORS.blue};font-weight:600;text-decoration:none;transition:color 0.2s" onmouseover="this.style.color='#2563EB'" onmouseout="this.style.color='${COLORS.blue}'"><i data-lucide="file-text" style="width:1rem;height:1rem"></i> Voir le document <i data-lucide="external-link" style="width:0.75rem;height:0.75rem"></i></a>` : ''}
                </div>
            </div>
        </div>`;
}

// ─── I. MODAL CRUD — CRÉER / MODIFIER ────────────────────────
async function openActivityModal(id = null) {
    const isEdit = !!id;
    let activity = {
        title: '',
        activity_type: 'certification',
        description: '',
        organization: '',
        date_start: '',
        date_end: '',
        document_url: ''
    };

    if (isEdit) {
        const found = activities.find(a => a.id === id);
        if (found) activity = { ...activity, ...found };
    }

    const activityTypes = [
        { value:'certification', label:'Certification', icon:'certificate', color: COLORS.accent, bg: COLORS.accentLight },
        { value:'training',      label:'Formation',     icon:'graduation-cap', color: COLORS.blue, bg: COLORS.blueLight },
        { value:'event',         label:'Événement',     icon:'calendar-check', color: COLORS.purple, bg: COLORS.purpleLight },
        { value:'collaboration', label:'Collaboration', icon:'users', color: COLORS.primary, bg: COLORS.primaryLight },
        { value:'award',         label:'Récompense',    icon:'trophy', color: COLORS.accent, bg: COLORS.accentLight },
        { value:'other',         label:'Autre',         icon:'star', color: COLORS.textMuted, bg: COLORS.surface }
    ];

    const selectedType = activityTypes.find(t => t.value === activity.activity_type) || activityTypes[0];

    const html = `
        <div class="modal-header">
            <h3 class="modal-title">
                <i data-lucide="${isEdit ? 'pencil' : 'plus'}" style="width:1.25rem;height:1.25rem;color:${COLORS.primary}"></i>
                ${isEdit ? "Modifier l'activité" : 'Nouvelle activité'}
            </h3>
            <button class="modal-close" onclick="closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="activityForm" style="padding:24px 28px 28px">
            <input type="hidden" name="id" value="${id || ''}">

            <div class="form-group">
                <label>Titre de l'activité <span style="color:${COLORS.error}">*</span></label>
                <input type="text" name="title" value="${escapeHtml(activity.title)}" placeholder="Ex: Certification en plomberie professionnelle" required>
            </div>

            <div class="form-group">
                <label>Type d'activité <span style="color:${COLORS.error}">*</span></label>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px" id="typeSelector">
                    ${activityTypes.map(t => `
                        <label style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;border:1.5px solid ${activity.activity_type === t.value ? COLORS.primary : COLORS.border};border-radius:12px;cursor:pointer;transition:all 0.2s;background:${activity.activity_type === t.value ? COLORS.primaryDim : COLORS.white}">
                            <input type="radio" name="activity_type" value="${t.value}" ${activity.activity_type === t.value ? 'checked' : ''} style="display:none">
                            <i data-lucide="${t.icon}" style="width:1.25rem;height:1.25rem;color:${activity.activity_type === t.value ? t.color : COLORS.textMuted}"></i>
                            <span style="font-size:0.75rem;font-weight:600;color:${activity.activity_type === t.value ? COLORS.textPrimary : COLORS.textMuted}">${t.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <div class="form-group">
                <label>Organisation / Institution</label>
                <input type="text" name="organization" value="${escapeHtml(activity.organization || '')}" placeholder="Ex: Centre de Formation Professionnelle de Yaoundé">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Date de début</label>
                    <input type="date" name="date_start" value="${activity.date_start || ''}">
                </div>
                <div class="form-group">
                    <label>Date de fin <span style="font-weight:400;color:${COLORS.textMuted}">(optionnel)</span></label>
                    <input type="date" name="date_end" value="${activity.date_end || ''}">
                </div>
            </div>

            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="4" placeholder="Décrivez cette activité, ce que vous avez appris ou accompli...">${escapeHtml(activity.description || '')}</textarea>
            </div>

            <div class="form-group">
                <label>Lien du document / certificat <span style="font-weight:400;color:${COLORS.textMuted}">(optionnel)</span></label>
                <input type="url" name="document_url" value="${escapeHtml(activity.document_url || '')}" placeholder="https://...">
                <span style="font-size:0.75rem;color:${COLORS.textMuted};margin-top:4px;display:block">Ajoutez un lien vers votre certificat ou document justificatif</span>
            </div>

            <div style="background:${COLORS.blueLight};border-radius:12px;padding:14px 16px;margin-bottom:24px;display:flex;align-items:flex-start;gap:10px">
                <i data-lucide="info" style="width:1.125rem;height:1.125rem;color:${COLORS.blue};flex-shrink:0;margin-top:1px"></i>
                <div>
                    <div style="font-weight:600;font-size:0.8125rem;color:${COLORS.blue};margin-bottom:2px">Pourquoi ajouter vos activités ?</div>
                    <p style="font-size:0.8125rem;color:${COLORS.textSecondary};line-height:1.5;margin:0">Les prestataires qui documentent leurs certifications et formations reçoivent <strong style="color:${COLORS.textPrimary}">3x plus de demandes</strong> de clients.</p>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">
                    <i data-lucide="save"></i> ${isEdit ? 'Enregistrer' : "Ajouter l'activité"}
                </button>
            </div>
        </form>`;

    openModal(html);

    // Type selector UX avec couleurs modernes
    document.querySelectorAll('#typeSelector label').forEach((label, index) => {
        label.addEventListener('click', function() {
            this.querySelector('input').checked = true;
            const type = activityTypes[index];
            document.querySelectorAll('#typeSelector label').forEach((l, i) => {
                const t = activityTypes[i];
                l.style.borderColor = COLORS.border;
                l.style.background = COLORS.white;
                l.querySelector('i').style.color = COLORS.textMuted;
                l.querySelector('span').style.color = COLORS.textMuted;
            });
            this.style.borderColor = COLORS.primary;
            this.style.background = COLORS.primaryDim;
            this.querySelector('i').style.color = type.color;
            this.querySelector('span').style.color = COLORS.textPrimary;
        });
    });

    // ── SUBMIT : INSERT ou UPDATE dans provider_activities ────
    document.getElementById('activityForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const fd   = new FormData(this);
        const data = Object.fromEntries(fd.entries());

        // Nettoyage pour correspondre au schéma provider_activities
        data.title        = data.title.trim();
        data.description  = data.description.trim() || null;
        data.organization = data.organization.trim() || null;
        data.date_start   = data.date_start || null;
        data.date_end     = data.date_end   || null;
        data.document_url = data.document_url.trim() || null;

        delete data.id;

        // Désactiver le bouton pendant l'envoi
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block"></span> Envoi...';

        try {
            if (isEdit) {
                const { error } = await sb.from('provider_activities').update(data).eq('id', id);
                if (error) throw error;
                showToast('Activité mise à jour avec succès', 'success');
            } else {
                data.user_id = currentUser.id;
                const { error } = await sb.from('provider_activities').insert([data]);
                if (error) throw error;
                showToast('Activité ajoutée avec succès', 'success');
            }
            closeModal();
            activities = await getActivities();
            updateStats();
            renderActivities();
        } catch (err) {
            console.error('Erreur provider_activities :', err);
            if (err.code === '23503') {
                showToast("Erreur de profil utilisateur. Complétez votre inscription d'abord.", 'error');
            } else if (err.code === '23514') {
                showToast("Type d'activité invalide. Choisissez parmi les options proposées.", 'error');
            } else {
                showToast('Erreur : ' + (err.message || 'Réessayez.'), 'error');
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        }
    });
}

// ─── J. SUPPRIMER ────────────────────────────────────────────
async function deleteActivity(id) {
    const a = activities.find(x => x.id === id);
    if (!a) return;
    const ok = await confirmAction(`Supprimer définitivement l'activité <strong>"${escapeHtml(a.title)}"</strong> ? Cette action est irréversible.`);
    if (!ok) return;
    
    try {
        const { error } = await sb.from('provider_activities').delete().eq('id', id);
        if (error) throw error;
        activities = await getActivities();
        updateStats();
        renderActivities();
        showToast('Activité supprimée', 'info');
    } catch (err) {
        showToast('Erreur : ' + err.message, 'error');
    }
}

// ─── K. DÉMARRAGE ────────────────────────────────────────────
async function loadActivities() {
    await initDashboard();
    setActiveNav('activities');
    activities = await getActivities();
    updateStats();
    renderActivities();
}

// ═══ Lancement ═══
document.addEventListener('DOMContentLoaded', () => {
    loadActivities();
});
