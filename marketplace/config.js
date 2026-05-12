/**
 * ═══════════════════════════════════════════════════════════════
 *  CamServices — config.js
 *  Initialisation du client Supabase partagé par toutes les pages
 *
 *  ⚠️  Ce fichier DOIT être chargé après le SDK Supabase :
 *      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *      <script src="config.js"></script>
 * ═══════════════════════════════════════════════════════════════
 */

/* ─────────────────────────────────────────────
   🔑  REMPLACEZ CES VALEURS PAR LES VÔTRES
   Retrouvez-les dans :
   Supabase Dashboard → Project Settings → API
───────────────────────────────────────────── */
const SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';


/* ─────────────────────────────────────────────
   Création du client
   window.supabase  → utilisable dans tous les scripts suivants
───────────────────────────────────────────── */
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:   true,   // garde la session dans localStorage
    autoRefreshToken: true,   // renouvelle automatiquement le JWT
    detectSessionInUrl: true, // gère les liens magiques / OAuth callbacks
  },
  global: {
    headers: {
      'X-Client-Info': 'camservices-web/1.0',
    },
  },
});