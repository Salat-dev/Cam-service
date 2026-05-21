async function loadDashboard() {
    const [users, providers, orders, pending] = await Promise.all([
        sb.from('users').select('*', { count: 'exact', head: true }),
        sb.from('users').select('*', { count: 'exact', head: true }).eq('role', 'prestataire'),
        sb.from('orders').select('*', { count: 'exact', head: true }),
        sb.from('users').select('*', { count: 'exact', head: true }).eq('role', 'prestataire').eq('verification_status', 'pending')
    ]);

    document.getElementById('mainContent').innerHTML = `
        <div class="page-header"><h1 class="page-title">Tableau de <span>bord</span></h1></div>
        <div class="stats-grid">
            ${statCard('users', '#3B82F6', '#EFF6FF', users.count, 'Utilisateurs')}
            ${statCard('briefcase', '#22C55E', '#F0FDF4', providers.count, 'Prestataires')}
            ${statCard('shopping-bag', '#7C3AED', '#F5F3FF', orders.count, 'Commandes')}
            ${statCard('clock', '#F59E0B', '#FFFBEB', pending.count, 'En attente')}
        </div>`;
    
    lucide.createIcons();
}

function statCard(icon, color, bg, value, label) {
    return `<div class="stat-card">
        <div class="stat-icon" style="background:${bg};color:${color}"><i data-lucide="${icon}"></i></div>
        <div class="stat-value">${value || 0}</div>
        <div class="stat-label">${label}</div>
    </div>`;
}

loadDashboard();
