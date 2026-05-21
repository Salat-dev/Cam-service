const SUPABASE_URL = 'https://cwubxwbzzuigctvgdygv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// Vérifier l'accès admin
async function checkAdminAccess() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = '../login.html'; return false; }
    const { data: profile } = await sb.from('users').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') { showToast('Accès refusé', 'error'); setTimeout(() => window.location.href = '../landing.html', 1500); return false; }
    return true;
}

// Toast notifications
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:10000;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(container);
    }
    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    const colors = { success: '#22C55E', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' };
    const toast = document.createElement('div');
    toast.style.cssText = `display:flex;align-items:center;gap:12px;padding:16px 20px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);font-size:.875rem;color:#111827;pointer-events:auto;min-width:320px;animation:slideIn .3s ease;border-left:4px solid ${colors[type]};`;
    toast.innerHTML = `<i data-lucide="${icons[type]}" style="color:${colors[type]}"></i><span>${message}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:#6B7280">✕</button>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = 'all .3s'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// Utilitaires
function esc(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
function fmt(p) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(p || 0); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }

async function logout() { await sb.auth.signOut(); window.location.href = '../landing.html'; }

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    checkAdminAccess();
});