// ═══════════════════════════════════════════
// CLIENT-AUTH.JS — Gestion auth client
// ═══════════════════════════════════════════

  var SUPABASE_URL  = 'https://cwubxwbzzuigctvgdygv.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';

var sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

var _clientUser = null;
var _clientSession = null;

// Vérifier la session au chargement
async function initClientAuth() {
    var { data } = await sbClient.auth.getSession();
    if (data.session) {
        _clientSession = data.session;
        _clientUser = data.session.user;
        updateNavForLoggedUser();
    }
}

// Mettre à jour la navbar
function updateNavForLoggedUser() {
    var loginLinks = document.querySelectorAll('.nav-login-link');
    for (var i = 0; i < loginLinks.length; i++) {
        if (_clientUser) {
            loginLinks[i].textContent = 'Mon compte';
            loginLinks[i].href = '#';
        } else {
            loginLinks[i].textContent = 'Connexion';
            loginLinks[i].href = 'login-client.html';
        }
    }
}

// Ajouter au panier (vérifie connexion)
async function addToCartWithAuth(serviceData) {
    if (!_clientUser) {
        if (confirm('Connectez-vous pour ajouter au panier.')) {
            window.location.href = 'login-client.html';
        }
        return false;
    }

    var cart = JSON.parse(localStorage.getItem('camservices_cart') || '[]');
    var exists = false;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].serviceId === serviceData.serviceId) { exists = true; break; }
    }
    if (!exists) {
        cart.push(serviceData);
        localStorage.setItem('camservices_cart', JSON.stringify(cart));
    }
    return true;
}

// Commander (vérifie connexion)
async function sendOrderWithAuth(orderData) {
    if (!_clientSession) {
        alert('Veuillez vous connecter pour commander.');
        window.location.href = 'login-client.html';
        return null;
    }
    orderData.client_id = _clientUser.id;
    var { data, error } = await sbClient.from('orders').insert(orderData);
    return { data, error };
}

// Initialiser
document.addEventListener('DOMContentLoaded', function() {
    initClientAuth();
});