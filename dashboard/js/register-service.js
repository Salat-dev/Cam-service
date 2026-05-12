
// ============================================================
(function () {
'use strict';

// ─── 1. Supabase initialisation ────────────────────────────
// Remplacez par vos propres clés Supabase
var SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';
// ============================================================

var sb = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON)
    : null;
 
if (!sb) {
    console.error('Supabase JS SDK introuvable.');
    return;
}
 
// ─── 2. Références DOM ─────────────────────────────────────
var serviceForm    = document.getElementById('serviceForm');
var formAlert      = document.getElementById('formAlert');
var submitBtn      = document.getElementById('submitBtn');
 
var titleInput     = document.getElementById('serviceTitle');
var categorySelect = document.getElementById('serviceCategory');
var pricingType    = document.getElementById('pricingType');
var priceInput     = document.getElementById('servicePrice');
var durationGroup  = document.getElementById('durationGroup');
var durationInput  = document.getElementById('serviceDuration');
var descInput      = document.getElementById('serviceDescription');
 
// ─── 3. UX : afficher / masquer le champ durée ─────────────
pricingType.addEventListener('change', function () {
    var showDuration = ['hourly', 'daily'].includes(pricingType.value);
    durationGroup.style.display = showDuration ? 'block' : 'none';
    if (!showDuration) durationInput.value = '';
});
 
// ─── 4. Auth : récupérer l'utilisateur connecté ─────────────
async function getCurrentUser() {
    var result = await sb.auth.getUser();
    var user   = result.data && result.data.user ? result.data.user : null;
    return user;
}
 
// ─── 5. Sync : s'assurer que le profil existe dans public.users
//        Résout l'erreur FK « Key (user_id) is not present in table users »
// ─────────────────────────────────────────────────────────────
async function ensurePublicProfile(authUser) {
    // Vérifie si l'utilisateur existe déjà dans public.users
    var check = await sb
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();
 
    if (check.data) return true; // profil trouvé, tout va bien
 
    // Le profil n'existe pas → on le crée avec les infos disponibles
    var meta = authUser.user_metadata || {};
 
    var profileData = {
        id:            authUser.id,
        email:         authUser.email,
        password_hash: 'managed_by_supabase_auth',       // placeholder, auth gère le mdp
        username:      meta.username  || authUser.email.split('@')[0],
        full_name:     meta.full_name || meta.name || 'Utilisateur',
        phone:         meta.phone     || authUser.phone || '',
        city:          meta.city      || '',
        neighborhood:  meta.neighborhood || '',
        role:          'prestataire'
    };
 
    var insert = await sb
        .from('users')
        .insert([profileData])
        .select('id')
        .single();
 
    if (insert.error) {
        console.error('Impossible de créer le profil :', insert.error);
        return false;
    }
 
    return true;
}
 
// ─── 6. Helpers : alertes et loading ────────────────────────
function showAlert(message, type) {
    type = type || 'error';
    formAlert.textContent   = message;
    formAlert.className     = 'alert ' + type;
    formAlert.style.display = 'flex';
    if (type === 'success') {
        setTimeout(function () { formAlert.style.display = 'none'; }, 5000);
    }
}
 
function hideAlert() {
    formAlert.style.display = 'none';
    formAlert.className     = 'alert';
}
 
function setLoading(isLoading) {
    if (isLoading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}
 
// ─── 7. Validation côté client ──────────────────────────────
function validateForm() {
    var title    = titleInput.value.trim();
    var category = categorySelect.value;
    var price    = parseFloat(priceInput.value);
 
    if (!title || title.length < 3) {
        showAlert('Le titre doit contenir au moins 3 caractères.');
        titleInput.focus();
        return false;
    }
    if (title.length > 120) {
        showAlert('Le titre ne doit pas dépasser 120 caractères.');
        titleInput.focus();
        return false;
    }
    if (!category) {
        showAlert('Veuillez sélectionner une catégorie.');
        categorySelect.focus();
        return false;
    }
    if (isNaN(price) || price < 100) {
        showAlert('Le prix minimum est de 100 FCFA.');
        priceInput.focus();
        return false;
    }
    if (price > 50000000) {
        showAlert('Le prix semble trop élevé. Vérifiez le montant.');
        priceInput.focus();
        return false;
    }
 
    var duration = parseInt(durationInput.value, 10);
    if (durationInput.value && (isNaN(duration) || duration < 15)) {
        showAlert('La durée minimum est de 15 minutes.');
        durationInput.focus();
        return false;
    }
 
    return true;
}
 
// ─── 8. Soumission du formulaire ────────────────────────────
serviceForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAlert();
 
    if (!validateForm()) return;
 
    // 8a — vérifier la session
    var user = await getCurrentUser();
    if (!user) {
        showAlert('Vous devez être connecté pour créer un service.');
        setTimeout(function () { window.location.href = 'login.html'; }, 2000);
        return;
    }
 
    setLoading(true);
 
    // 8b — s'assurer que le profil public existe (corrige l'erreur FK 23503)
    var profileOk = await ensurePublicProfile(user);
    if (!profileOk) {
        showAlert("Impossible de vérifier votre profil. Veuillez compléter votre inscription d'abord.");
        setLoading(false);
        return;
    }
 
    // 8c — construire l'objet service
    var duration = parseInt(durationInput.value, 10);
 
    var serviceData = {
        user_id:          user.id,
        title:            titleInput.value.trim(),
        category:         categorySelect.value,
        price:            parseFloat(priceInput.value),
        pricing_type:     pricingType.value,
        duration_minutes: isNaN(duration) ? null : duration,
        description:      descInput.value.trim() || null,
        is_active:        true,
        image_url:        null
    };
 
    // 8d — INSERT dans Supabase
    try {
        var response = await sb
            .from('services')
            .insert([serviceData])
            .select()
            .single();
 
        if (response.error) throw response.error;
 
        showAlert('Service créé avec succès !', 'success');
 
        serviceForm.reset();
        durationGroup.style.display = 'none';
 
        setTimeout(function () {
            window.location.href = 'services.html';
        }, 1500);
 
    } catch (err) {
        console.error('Erreur Supabase :', err);
 
        if (err.code === '23503') {
            showAlert("Votre profil utilisateur est incomplet. Veuillez d'abord compléter votre inscription.");
        } else if (err.code === '23505') {
            showAlert('Un service identique existe déjà.');
        } else if (err.code === '42501') {
            showAlert("Vous n'avez pas les permissions nécessaires (RLS).");
        } else {
            showAlert(err.message || 'Une erreur est survenue. Réessayez.');
        }
    } finally {
        setLoading(false);
    }
});
 
// ─── 9. Init : vérifier la session au chargement ───────────
document.addEventListener('DOMContentLoaded', async function () {
    if (window.lucide) lucide.createIcons();
 
    var user = await getCurrentUser();
    if (!user) {
        showAlert('Connectez-vous pour accéder à cette page.');
        setTimeout(function () { window.location.href = 'login.html'; }, 2500);
    }
});
 
})(); // fin IIFE
 