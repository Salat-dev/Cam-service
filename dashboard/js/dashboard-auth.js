

(function () {

  /* ── 1. Masquer le body le temps de vérifier ─────────────────── */
  document.documentElement.style.visibility = 'hidden';

  /* ── 2. Attendre que config.js ait créé window.supabase ────────
     config.js s'exécute juste avant ce script grâce à l'ordre des
     balises <script>. On fait quand même un micro-wait au cas où.   */
  async function checkAuth () {

    /* Petit garde-fou : si supabase n'est pas encore dispo, on attend */
    let retries = 0;
    while ((!window.supabase || !window._supabaseClient) && retries < 20) {
      await new Promise(r => setTimeout(r, 50));
      retries++;
    }

    /* Récupère le client Supabase exposé par config.js.
       Adapte le nom de variable si le tien est différent (ex: "sb", "supabase") */
    const client = window._supabaseClient || window.sbClient || window.supabase;

    if (!client) {
      console.error('[auth-guard] Client Supabase introuvable. Vérifie config.js');
      redirectToLogin();
      return;
    }

    try {
      /* getSession() lit localStorage → SYNCHRONE côté JS, pas de réseau */
      const { data: { session }, error } = await client.auth.getSession();

      if (error || !session) {
        console.warn('[auth-guard] Pas de session →', error?.message || 'null');
        redirectToLogin();
        return;
      }

      /* Session valide ✅ */
      window.__authSession  = session;
      window.__authUser     = session.user;
      console.log('[auth-guard] ✅ Session OK —', session.user.email);
      document.documentElement.style.visibility = 'visible';

    } catch (err) {
      console.error('[auth-guard] Erreur inattendue :', err);
      redirectToLogin();
    }
  }

  function redirectToLogin () {
    /* Détermine le chemin relatif selon la profondeur de la page */
    const depth   = location.pathname.split('/').filter(Boolean).length;
    const base    = depth > 1 ? '../'.repeat(depth - 1) : './';
    const target  = base + 'login.html';
    console.warn('[auth-guard] Redirection →', target);
    window.location.replace(target);
  }

  checkAuth();

})();