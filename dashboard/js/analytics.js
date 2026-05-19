    let currentPeriod = 7;
    let allOrders = [];
    let allViews = [];
    
    async function loadAnalytics() {
        await initDashboard();
        setActiveNav('analytics');
        
        // Charger toutes les données
        const [orders, views, services] = await Promise.all([
            getAllOrders(),
            getProfileViews(365),
            getMyServices()
        ]);
        
        allOrders = orders;
        allViews = views;
        
        // Boutons de période
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentPeriod = parseInt(this.dataset.period) || 'all';
                updateAllCharts();
            });
        });
        
        updateAllCharts();
    }
    
    function updateAllCharts() {
        const since = currentPeriod === 'all' 
            ? new Date(0) 
            : new Date(Date.now() - currentPeriod * 24 * 60 * 60 * 1000);
        
        const periodOrders = allOrders.filter(o => new Date(o.created_at) >= since);
        const periodViews = allViews.filter(v => new Date(v.viewed_at) >= since);
        
        updateKPIs(periodOrders, periodViews);
        renderRevenueChart(periodOrders);
        renderOrdersChart(periodOrders);
        renderOrdersDetail(periodOrders);
        renderVisitorsList(periodViews);
        renderTopServices(periodOrders);
        
        // Mettre à jour le label de période
        const periodLabels = {
            7: '7 derniers jours',
            30: '30 derniers jours',
            90: '3 derniers mois',
            'all': 'Depuis le début'
        };
        document.getElementById('revenuePeriod').textContent = periodLabels[currentPeriod] || '';
        document.getElementById('visitorsCount').textContent = `${periodViews.length} visiteur(s)`;
        
        lucide.createIcons();
    }
    
    function updateKPIs(orders, views) {
        const revenue = orders
            .filter(o => o.status === 'completed')
            .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
        
        const completedOrders = orders.filter(o => o.status === 'completed').length;
        const totalOrders = orders.length;
        
        // Taux de réponse : commandes confirmées / total (hors annulées)
        const actionableOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'deleted');
        const responseRate = actionableOrders.length > 0 
            ? Math.round((actionableOrders.filter(o => o.status !== 'pending').length / actionableOrders.length) * 100)
            : 100;
        
        const grid = document.getElementById('kpiGrid');
        grid.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-icon gold"><i data-lucide="banknote"></i></div>
                    <i data-lucide="trending-up" style="color:var(--green);width:1.2rem;height:1.2rem"></i>
                </div>
                <div class="stat-value">${formatPrice(revenue)}</div>
                <div class="stat-label">Chiffre d'affaires</div>
                <div class="stat-trend up">${completedOrders} commandes complétées</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-icon green"><i data-lucide="shopping-bag"></i></div>
                </div>
                <div class="stat-value">${totalOrders}</div>
                <div class="stat-label">Commandes totales</div>
                <div class="stat-trend up">${completedOrders} terminées</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-icon blue"><i data-lucide="eye"></i></div>
                </div>
                <div class="stat-value">${views.length}</div>
                <div class="stat-label">Vues du profil</div>
                <div class="stat-trend ${views.length > 0 ? 'up' : ''}">${views.length > 0 ? 'Visibilité active' : 'Aucune vue'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <div class="stat-icon purple"><i data-lucide="message-circle"></i></div>
                </div>
                <div class="stat-value">${responseRate}%</div>
                <div class="stat-label">Taux de réponse</div>
                <div class="stat-trend ${responseRate >= 80 ? 'up' : responseRate >= 50 ? '' : 'down'}">
                    ${responseRate >= 80 ? 'Excellent' : responseRate >= 50 ? 'Correct' : 'À améliorer'}
                </div>
            </div>
        `;
        lucide.createIcons();
    }
    
    function renderRevenueChart(orders) {
        const container = document.getElementById('revenueChart');
        const completedOrders = orders.filter(o => o.status === 'completed');
        
        if (completedOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="bar-chart-3" class="empty-icon" style="width:3rem;height:3rem"></i>
                    <p style="font-size:.85rem">Aucune commande complétée sur cette période</p>
                </div>
            `;
            return;
        }
        
        // Grouper par jour
        const byDay = {};
        completedOrders.forEach(o => {
            const day = new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            byDay[day] = (byDay[day] || 0) + parseFloat(o.total_amount || 0);
        });
        
        const days = Object.keys(byDay);
        const values = Object.values(byDay);
        const maxValue = Math.max(...values, 1);
        
        container.innerHTML = `
            <div class="bar-chart">
                ${days.map((day, i) => `
                    <div class="bar-item">
                        <div class="bar-wrapper">
                            <div class="bar" style="height:${(values[i] / maxValue) * 100}%">
                                <span class="bar-tooltip">${formatPrice(values[i])}</span>
                            </div>
                        </div>
                        <span class="bar-label">${day}</span>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:.72rem;color:var(--muted)">
                <span>Total: ${formatPrice(values.reduce((a,b) => a+b, 0))}</span>
                <span>Moy: ${formatPrice(Math.round(values.reduce((a,b) => a+b, 0) / values.length))}/jour</span>
            </div>
        `;
    }
    
    function renderOrdersChart(orders) {
        const container = document.getElementById('ordersChart');
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="pie-chart" class="empty-icon" style="width:3rem;height:3rem"></i>
                    <p style="font-size:.85rem">Aucune commande sur cette période</p>
                </div>
            `;
            return;
        }
        
        const statusCounts = {};
        orders.forEach(o => {
            statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        
        const total = orders.length;
        const colors = {
            pending: '#F59E0B',
            confirmed: '#3B82F6',
            in_progress: '#7C3AED',
            completed: '#3D8B5E',
            cancelled: '#DC2626',
            deleted: '#6B7280'
        };
        
        let cumulativePercent = 0;
        const segments = Object.entries(statusCounts).map(([status, count]) => {
            const percent = (count / total) * 100;
            const startPercent = cumulativePercent;
            cumulativePercent += percent;
            
            const color = colors[status] || '#C9C2B8';
            
            return {
                status,
                count,
                percent,
                color,
                startPercent
            };
        });
        
        const gradientParts = segments.map(s => 
            `${s.color} ${s.startPercent}% ${s.startPercent + s.percent}%`
        ).join(', ');
        
        container.innerHTML = `
            <div style="display:flex;align-items:center;gap:32px;padding:20px">
                <div class="donut-chart" style="background:conic-gradient(${gradientParts})">
                    <div class="donut-center">
                        <span class="donut-value">${total}</span>
                        <span class="donut-label">Total</span>
                    </div>
                </div>
                <div class="legend">
                    ${segments.map(s => `
                        <div class="legend-item">
                            <span class="legend-dot" style="background:${s.color}"></span>
                            <span class="legend-label">${formatStatus(s.status)}</span>
                            <span class="legend-value">${s.count} (${Math.round(s.percent)}%)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    function renderOrdersDetail(orders) {
        const container = document.getElementById('ordersDetailTable');
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="inbox" class="empty-icon" style="width:2rem;height:2rem"></i>
                    <p style="font-size:.85rem">Aucune commande</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr><th>Client</th><th>Montant</th><th>Date</th><th>Statut</th></tr>
                </thead>
                <tbody>
                    ${orders.slice(0, 10).map(o => `
                        <tr>
                            <td><strong>${o.client_name || 'Client'}</strong></td>
                            <td class="price-cell">${formatPrice(o.total_amount)}</td>
                            <td>${formatDate(o.created_at)}</td>
                            <td><span class="status-badge status-${o.status}">${formatStatus(o.status)}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    function renderVisitorsList(views) {
        const container = document.getElementById('visitorsList');
        
        if (views.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="users" class="empty-icon" style="width:2rem;height:2rem"></i>
                    <p style="font-size:.85rem">Aucun visiteur récent</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="visitors-feed">
                ${views.slice(0, 15).map(v => `
                    <div class="visitor-item">
                        <div class="visitor-avatar">
                            ${(v.viewer_name || 'A')[0].toUpperCase()}
                        </div>
                        <div class="visitor-info">
                            <strong>${v.viewer_name || 'Visiteur anonyme'}</strong>
                            <span>${formatTimeAgo(v.viewed_at)}</span>
                        </div>
                        <i data-lucide="eye" style="width:.9rem;height:.9rem;color:var(--faint)"></i>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    function renderTopServices(orders) {
        const container = document.getElementById('topServicesTable');
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p style="font-size:.85rem">Aucune donnée disponible</p>
                </div>
            `;
            return;
        }
        
        // Grouper par service
        const byService = {};
        orders.forEach(o => {
            const key = o.service_title || 'Service supprimé';
            if (!byService[key]) {
                byService[key] = { count: 0, revenue: 0, completed: 0 };
            }
            byService[key].count++;
            byService[key].revenue += parseFloat(o.total_amount || 0);
            if (o.status === 'completed') byService[key].completed++;
        });
        
        const sorted = Object.entries(byService)
            .sort((a, b) => b[1].revenue - a[1].revenue);
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Commandes</th>
                        <th>Terminées</th>
                        <th>Revenus</th>
                        <th>Performance</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(([name, data]) => {
                        const completionRate = data.count > 0 
                            ? Math.round((data.completed / data.count) * 100) 
                            : 0;
                        return `
                            <tr>
                                <td><strong>${name}</strong></td>
                                <td>${data.count}</td>
                                <td>${data.completed}</td>
                                <td class="price-cell">${formatPrice(data.revenue)}</td>
                                <td>
                                    <div class="performance-bar">
                                        <div class="performance-fill" style="width:${completionRate}%;background:${completionRate >= 80 ? 'var(--green)' : completionRate >= 50 ? 'var(--orange)' : 'var(--red)'}"></div>
                                    </div>
                                    <span style="font-size:.7rem;color:var(--muted)">${completionRate}%</span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }
    
    // Démarrer
    loadAnalytics();
