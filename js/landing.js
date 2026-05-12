/* ── Nav scroll ── */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

/* ── Mobile toggle ── */
document.getElementById('nav-toggle').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open');
});

/* ── Dynamic nav ── */
async function renderNav() {
  const c = document.getElementById('nav-links');
  if (!c) return;
  try {
    const session = await getSession();
    const profile = session ? await getUserProfile() : null;
    let h = '<li><a href="services.html">Services</a></li>';
    if (profile) {
      if (profile.role === 'prestataire') {
        h += '<li><a href="profile.html">Mon Profil</a></li>';
        h += '<li><a href="dashboard.html">Tableau de bord</a></li>';
      }
      if (profile.role === 'admin') h += '<li><a href="admin.html">Admin</a></li>';
      if (profile.role === 'client') h += '<li><a href="cart.html">Panier</a></li>';
      h += '<li><a href="#" onclick="logout();return false" class="nav-btn">' + profile.full_name + ' · Déconnexion</a></li>';
    } else {
      h += '<li><a href="login.html">Connexion</a></li>';
      h += '<li><a href="register.html" class="nav-btn">Créer un compte</a></li>';
    }
    c.innerHTML = h;
  } catch(e) {
    c.innerHTML = '<li><a href="login.html">Connexion</a></li><li><a href="register.html" class="nav-btn">Créer un compte</a></li>';
  }
}
renderNav();

/* ── Scroll reveal ── */
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 90);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

/* ── Stats ── */
async function loadStats() {
  try {
    const { count: sc } = await supabase.from('services').select('*', { count: 'exact', head: true });
    const { count: pc } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'prestataire').eq('status', 'verified');
    if (sc > 0) document.getElementById('stat-services').textContent = sc;
    if (pc > 0) document.getElementById('stat-providers').textContent = pc;
  } catch(e) {}
}
loadStats();

/* ── Services récents ── */
async function loadServices() {
  const container = document.getElementById('services-list');
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('id, title, description, price, user_id, users(full_name, city)')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;
    if (!services || !services.length) {
      container.innerHTML = '<div class="empty-msg"><span class="empty-emoji">🚀</span><p style="color:var(--muted)">Aucun service pour le moment. Soyez le premier !</p><br/><a href="register.html" class="btn btn-accent btn-sm" style="margin:0 auto;display:inline-flex">Devenir prestataire →</a></div>';
      return;
    }
    const icons = ['🔧','💻','📸','🏠','⚡','🎨','📚','🚗'];
    let html = '<div class="svc-grid">';
    services.forEach((s, i) => {
      const nom = s.users ? s.users.full_name : 'Inconnu';
      const ville = s.users ? s.users.city : '';
      const ini = nom.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const priceFormatted = typeof formatPrice === 'function' ? formatPrice(s.price) : s.price + ' FCFA';
      html += `
        <div class="svc-card reveal">
          <div class="svc-card-top">
            <div class="svc-thumb">${icons[i % icons.length]}</div>
            <div class="svc-price">${priceFormatted} <span>FCFA</span></div>
          </div>
          <div class="svc-title">${s.title}</div>
          <div class="svc-desc">${s.description || 'Pas de description.'}</div>
          <div class="svc-footer">
            <div class="prov-row">
              <div class="prov-init">${ini}</div>
              <div>
                <div class="prov-meta-name">${nom}</div>
                <div class="prov-meta-city">${ville}</div>
              </div>
            </div>
            <a href="service.html?id=${s.id}" class="btn btn-ghost btn-sm">Voir →</a>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
    document.querySelectorAll('#services-list .reveal').forEach(el => obs.observe(el));
  } catch(e) {
    container.innerHTML = '<div class="empty-msg" style="color:var(--muted)">Impossible de charger les services.</div>';
  }
}
loadServices();
