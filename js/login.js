// ═══════════════════════════════════════════
// CONFIGURATION SUPABASE (intégrée directement)
// ═══════════════════════════════════════════
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-anon-publique';

// Initialisation du client Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase initialisé pour login');

// ═══════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════

function showAlert(message, type = 'error') {
    const alert = document.getElementById('formAlert');
    if (!alert) return;
    
    const icons = {
        success: '<i data-lucide="check-circle" style="width:1.1rem;height:1.1rem;flex-shrink:0"></i>',
        error: '<i data-lucide="alert-circle" style="width:1.1rem;height:1.1rem;flex-shrink:0"></i>',
        info: '<i data-lucide="info" style="width:1.1rem;height:1.1rem;flex-shrink:0"></i>'
    };
    
    alert.innerHTML = `${icons[type] || ''} <span>${message}</span>`;
    alert.className = `alert ${type}`;
    alert.style.display = 'flex';
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function hideAlert() {
    const alert = document.getElementById('formAlert');
    if (alert) {
        alert.style.display = 'none';
        alert.className = 'alert';
    }
}

function setLoading(isLoading) {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    if (isLoading) {
        loginBtn.disabled = true;
        loginBtn.dataset.originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = `
            <span>Connexion en cours...</span>
            <svg width="18" height="18" viewBox="0 0 24 24" style="animation: spin 0.7s linear infinite">
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
            </svg>
        `;
    } else {
        loginBtn.disabled = false;
        if (loginBtn.dataset.originalText) {
            loginBtn.innerHTML = loginBtn.dataset.originalText;
        }
    }
}

// Ajouter le style pour l'animation spin
if (!document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
}

// ═══════════════════════════════════════════
// INITIALISATION AU CHARGEMENT
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('✅ Page login chargée');
    
    // Éléments DOM
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const rememberMe = document.getElementById('rememberMe');
    
    // Vérifier les éléments
    if (!loginForm) {
        console.error('❌ Formulaire de connexion introuvable');
        return;
    }
    
    console.log('✅ Formulaire trouvé');
    
    // ═══════════════ TOGGLE MOT DE PASSE ═══════════════
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            // Changer l'icône
            const icon = this.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
    }
    
    // ═══════════════ CHARGER L'EMAIL MÉMORISÉ ═══════════════
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberMe) rememberMe.checked = true;
    }
    
    // ═══════════════ VÉRIFIER SI DÉJÀ CONNECTÉ ═══════════════
    async function checkExistingSession() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                console.log('✅ Session existante trouvée');
                showAlert('Vous êtes déjà connecté. Redirection...', 'info');
                setTimeout(() => {
                    redirectBasedOnRole(session.user.id);
                }, 1000);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur vérification session:', error);
            return false;
        }
    }
    
    // ═══════════════ REDIRECTION SELON LE RÔLE ═══════════════
    async function redirectBasedOnRole(userId) {
        try {
            const { data: profile } = await supabaseClient
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();
            
            if (profile?.role === 'prestataire' || profile?.role === 'admin') {
                window.location.href = 'dashboard/index.html';
            } else {
                window.location.href = 'landing.html';
            }
        } catch (error) {
            console.error('Erreur récupération rôle:', error);
            window.location.href = 'dashboard/index.html';
        }
    }
    
    // ═══════════════ SOUMISSION DU FORMULAIRE ═══════════════
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🚀 Tentative de connexion...');
        
        // Cacher les anciennes alertes
        hideAlert();
        
        // Récupérer les valeurs
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const remember = rememberMe ? rememberMe.checked : false;
        
        // Validation basique
        if (!email) {
            showAlert('Veuillez entrer votre adresse email.');
            if (emailInput) emailInput.focus();
            return;
        }
        
        if (!email.includes('@')) {
            showAlert('Veuillez entrer une adresse email valide.');
            if (emailInput) emailInput.focus();
            return;
        }
        
        if (!password) {
            showAlert('Veuillez entrer votre mot de passe.');
            if (passwordInput) passwordInput.focus();
            return;
        }
        
        if (password.length < 6) {
            showAlert('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        
        // Activer le loading
        setLoading(true);
        
        try {
            console.log('🔐 Appel Supabase Auth...');
            
            // Tentative de connexion
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('❌ Erreur Auth:', error);
                
                // Messages d'erreur personnalisés
                if (error.message.includes('Invalid login credentials') || 
                    error.message.includes('Invalid email or password')) {
                    throw new Error('Email ou mot de passe incorrect.');
                }
                if (error.message.includes('Email not confirmed')) {
                    throw new Error('Veuillez confirmer votre adresse email. Vérifiez vos spams.');
                }
                if (error.message.includes('rate limit') || error.message.includes('too many')) {
                    throw new Error('Trop de tentatives. Veuillez patienter quelques minutes.');
                }
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new Error('Erreur de connexion. Vérifiez votre internet.');
                }
                
                throw new Error(error.message);
            }
            
            if (!data.user) {
                throw new Error('Aucun utilisateur retourné. Veuillez réessayer.');
            }
            
            console.log('✅ Connexion réussie:', data.user.id);
            
            // Sauvegarder l'email si "Se souvenir de moi"
            if (remember) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Afficher succès
            showAlert('✅ Connexion réussie ! Redirection...', 'success');
            
            // Rediriger après un court délai
            setTimeout(() => {
                redirectBasedOnRole(data.user.id);
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            showAlert(error.message || 'Une erreur est survenue. Veuillez réessayer.');
            setLoading(false);
        }
    });
    
    // ═══════════════ CONNEXION GOOGLE ═══════════════
    window.loginWithGoogle = async function() {
        console.log('🔵 Tentative connexion Google...');
        hideAlert();
        
        try {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard/index.html',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });
            
            if (error) {
                console.error('❌ Erreur Google:', error);
                showAlert('Erreur de connexion Google : ' + error.message);
            }
            // Si pas d'erreur, Supabase redirige automatiquement
            
        } catch (error) {
            console.error('❌ Erreur Google:', error);
            showAlert('Erreur de connexion Google. Veuillez réessayer.');
        }
    };
    
    // ═══════════════ CONNEXION FACEBOOK ═══════════════
    window.loginWithFacebook = async function() {
        console.log('🔵 Tentative connexion Facebook...');
        hideAlert();
        
        try {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: window.location.origin + '/dashboard/index.html'
                }
            });
            
            if (error) {
                console.error('❌ Erreur Facebook:', error);
                showAlert('Erreur de connexion Facebook : ' + error.message);
            }
            
        } catch (error) {
            console.error('❌ Erreur Facebook:', error);
            showAlert('Erreur de connexion Facebook. Veuillez réessayer.');
        }
    };
    
    // ═══════════════ INIT ═══════════════
    // Vérifier si une session existe déjà
    checkExistingSession().then(hasSession => {
        if (!hasSession) {
            console.log('✅ Prêt pour la connexion');
            // Focus sur le champ email
            if (emailInput && !emailInput.value) {
                setTimeout(() => emailInput.focus(), 500);
            }
        }
    });
    
    // Initialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    console.log('✅✅✅ Page login PRÊTE ✅✅✅');
});