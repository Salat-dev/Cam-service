/**
 * config.js — Configuration Supabase globale
 * Inclure EN PREMIER sur chaque page, APRÈS le SDK Supabase
 */

var SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';

/* Vérification de sécurité */
if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[config.js] ❌ SDK Supabase non chargé ! Ajoute le script CDN AVANT config.js');
}

/* Crée le client à partir de la lib */
var _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ✅ Remplace window.supabase (la lib) par le client instancié */
window.supabase        = _client;
window._supabaseClient = _client;
window.sbClient        = _client;
window.sb              = _client;