// ═══════════════════════════════════════════
// CONFIGURATION SUPABASE (intégrée directement)
// ═══════════════════════════════════════════
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-anon-publique';

// Initialisation du client Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase initialisé');

// ═══════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════

function showAlert(message, type = 'error') {
    const alert = document.getElementById('formAlert');
    if (!alert) return;
    
    const icons = {
        success: '<i data-lucide="check-circle" style="width:1rem;height:1rem"></i>',
        error: '<i data-lucide="alert-circle" style="width:1rem;height:1rem"></i>',
        info: '<i data-lucide="info" style="width:1rem;height:1rem"></i>'
    };
    
    alert.innerHTML = `${icons[type] || ''} ${message}`;
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

function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `
            <span>Patientez...</span>
            <svg width="18" height="18" viewBox="0 0 24 24" style="animation: spin 0.7s linear infinite">
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
            </svg>
        `;
    } else {
        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
}

async function uploadFile(file, bucket) {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });
    
    if (error) throw error;
    
    const { data: urlData } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
}

// Ajouter le style pour l'animation spin
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);

// ═══════════════════════════════════════════
// LOGIQUE DU FORMULAIRE MULTI-ÉTAPES
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    
    // État du formulaire
    let currentStep = 1;
    const totalSteps = 4;
    const skills = [];
    
    // Éléments DOM
    const form = document.getElementById('registerForm');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.querySelector('.progress-bar-fill');
    const skillsInput = document.getElementById('skillsInput');
    const skillsTags = document.getElementById('skillsTags');
    const domainExpertise = document.getElementById('domainExpertise');
    const wantVerification = document.getElementById('wantVerification');
    const verificationFields = document.getElementById('verificationFields');
    
    // Vérification des éléments essentiels
    if (!form) {
        console.error('❌ Formulaire introuvable');
        return;
    }
    
    console.log('✅ Tous les éléments DOM trouvés');
    
    // ═══════════════ GESTION DES SKILLS ═══════════════
    if (skillsInput) {
        skillsInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this.value.trim();
                if (value && !skills.includes(value)) {
                    skills.push(value);
                    renderSkills();
                }
                this.value = '';
            }
        });
    }
    
    function removeSkill(index) {
        skills.splice(index, 1);
        renderSkills();
    }
    
    function renderSkills() {
        if (!skillsTags) return;
        
        skillsTags.innerHTML = skills.map((s, i) => `
            <span class="skill-tag">
                ${s}
                <button type="button" class="skill-remove-btn" data-index="${i}" style="background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;padding:0;display:flex;align-items:center">
                    <i data-lucide="x" style="width:.75rem;height:.75rem"></i>
                </button>
            </span>
        `).join('');
        
        // Ajouter les écouteurs sur les boutons de suppression
        document.querySelectorAll('.skill-remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                removeSkill(parseInt(this.dataset.index));
            });
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Mettre à jour le champ caché
        if (domainExpertise) {
            domainExpertise.value = JSON.stringify(skills);
        }
    }
    
    // ═══════════════ TOGGLE VÉRIFICATION ═══════════════
    if (wantVerification && verificationFields) {
        wantVerification.addEventListener('change', function() {
            verificationFields.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // ═══════════════ PREVIEW FICHIERS ═══════════════
    function setupFilePreview(inputName, previewId) {
        const input = document.querySelector(`input[name="${inputName}"]`);
        const preview = document.getElementById(previewId);
        if (!input || !preview) return;
        
        input.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                preview.style.display = 'flex';
                preview.innerHTML = `
                    <i data-lucide="check-circle" style="width:1rem;height:1rem;color:var(--green)"></i>
                    <span>${this.files[0].name}</span>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
    }
    
    setupFilePreview('profile_photo', 'photoPreview');
    setupFilePreview('id_document', 'idPreview');
    
    // ═══════════════ NAVIGATION ═══════════════
    function updateUI() {
        // Afficher l'étape courante
        steps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 === currentStep);
        });
        
        // Mettre à jour les points de progression
        progressSteps.forEach((ps, i) => {
            ps.classList.remove('active', 'done');
            if (i + 1 < currentStep) ps.classList.add('done');
            if (i + 1 === currentStep) ps.classList.add('active');
        });
        
        // Barre de progression
        if (progressFill) {
            const percent = ((currentStep - 1) / (totalSteps - 1)) * 100;
            progressFill.style.width = percent + '%';
        }
        
        // Boutons
        if (prevBtn) prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
        if (nextBtn) nextBtn.style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
        if (submitBtn) submitBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
        
        // Icônes dans les dots
        updateStepIcons();
        
        // Cacher l'alerte
        hideAlert();
    }
    
    function updateStepIcons() {
        const dots = document.querySelectorAll('.step-dot');
        const icons = ['user', 'map-pin', 'briefcase', 'shield-check'];
        
        dots.forEach((dot, i) => {
            if (i + 1 < currentStep) {
                dot.innerHTML = '<i data-lucide="check" style="width:.9rem;height:.9rem"></i>';
            } else {
                dot.innerHTML = `<i data-lucide="${icons[i]}" style="width:.9rem;height:.9rem"></i>`;
            }
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    function validateStep(step) {
        const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
        if (!stepEl) return true;
        
        const requiredFields = stepEl.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            const value = field.value.trim();
            if (!value) {
                isValid = false;
                field.style.borderColor = '#DC2626';
                field.style.boxShadow = '0 0 0 3px rgba(220,38,38,.1)';
                setTimeout(() => {
                    field.style.borderColor = '#E8E2DA';
                    field.style.boxShadow = 'none';
                }, 2000);
            }
        });
        
        // Validation spécifique par étape
        if (step === 1) {
            const email = document.querySelector('input[name="email"]');
            const password = document.querySelector('input[name="password"]');
            const username = document.querySelector('input[name="username"]');
            
            if (email && email.value && !email.value.includes('@')) {
                isValid = false;
                showAlert('Veuillez entrer une adresse email valide.');
            }
            
            if (password && password.value && password.value.length < 8) {
                isValid = false;
                showAlert('Le mot de passe doit contenir au moins 8 caractères.');
            }
            
            if (username && username.value && username.value.length < 3) {
                isValid = false;
                showAlert('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
            }
        }
        
        if (!isValid && step !== 1) {
            showAlert('Veuillez remplir tous les champs obligatoires.');
        }
        
        return isValid;
    }
    
    function goToStep(step) {
        if (step >= 1 && step <= totalSteps && validateStep(currentStep)) {
            currentStep = step;
            updateUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // ═══════════════ ÉCOUTEURS DES BOUTONS ═══════════════
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (validateStep(currentStep) && currentStep < totalSteps) {
                currentStep++;
                updateUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentStep > 1) {
                currentStep--;
                updateUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    
    // ═══════════════ SOUMISSION DU FORMULAIRE ═══════════════
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🚀 Début inscription...');
        
        // Valider l'étape finale
        if (!validateStep(currentStep)) {
            console.warn('❌ Validation échouée');
            return false;
        }
        
        // Désactiver le bouton
        setButtonLoading(submitBtn, true);
        hideAlert();
        
        try {
            // Récupérer les données du formulaire
            const formData = new FormData(form);
            const data = {};
            
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) continue; // On gère les fichiers séparément
                data[key] = value.trim ? value.trim() : value;
            }
            
            console.log('📋 Données récupérées:', {
                email: data.email,
                full_name: data.full_name,
                username: data.username,
                phone: data.phone,
                city: data.city
            });
            
            // Ajouter les skills
            if (skills.length > 0) {
                data.domain_expertise = skills;
            }
            
            // Gérer la vérification
            if (!wantVerification || !wantVerification.checked) {
                data.verification_status = 'none';
                data.id_document_type = null;
            } else {
                data.verification_status = 'pending';
            }
            
            // Supprimer les champs qui ne sont pas dans la table
            delete data.want_verification;
            
            // ═══════════ ÉTAPE 1 : CRÉER LE COMPTE AUTH ═══════════
            console.log('🔐 Création compte Supabase Auth...');
            
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.full_name,
                        username: data.username,
                        role: 'prestataire'
                    },
                    emailRedirectTo: window.location.origin + '/login.html'
                }
            });
            
            if (authError) {
                console.error('❌ Erreur Auth:', authError);
                
                // Messages d'erreur personnalisés
                if (authError.message.includes('already registered') || 
                    authError.message.includes('already exists') ||
                    authError.message.includes('unique')) {
                    throw new Error('Un compte existe déjà avec cet email.');
                }
                if (authError.message.includes('password')) {
                    throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
                }
                if (authError.message.includes('rate limit')) {
                    throw new Error('Trop de tentatives. Veuillez patienter quelques secondes.');
                }
                
                throw new Error(authError.message);
            }
            
            if (!authData.user) {
                throw new Error('Impossible de créer le compte. Veuillez réessayer.');
            }
            
            console.log('✅ Compte Auth créé:', authData.user.id);
            
            // ═══════════ ÉTAPE 2 : UPLOAD DES FICHIERS ═══════════
            let profilePhotoUrl = null;
            let idDocumentUrl = null;
            
            const profilePhotoFile = formData.get('profile_photo');
            const idDocumentFile = formData.get('id_document');
            
            if (profilePhotoFile && profilePhotoFile.size > 0) {
                console.log('📸 Upload photo de profil...');
                try {
                    profilePhotoUrl = await uploadFile(profilePhotoFile, 'profile-photos');
                    console.log('✅ Photo uploadée');
                } catch (uploadError) {
                    console.warn('⚠️ Upload photo échoué:', uploadError.message);
                }
            }
            
            if (idDocumentFile && idDocumentFile.size > 0 && data.verification_status === 'pending') {
                console.log('📄 Upload pièce d\'identité...');
                try {
                    idDocumentUrl = await uploadFile(idDocumentFile, 'id-documents');
                    console.log('✅ Document uploadé');
                } catch (uploadError) {
                    console.warn('⚠️ Upload document échoué:', uploadError.message);
                }
            }
            
            // ═══════════ ÉTAPE 3 : INSÉRER LE PROFIL ═══════════
            console.log('💾 Création du profil...');
            
            const profileData = {
                id: authData.user.id,
                email: data.email,
                password_hash: 'managed_by_auth',
                full_name: data.full_name,
                username: data.username,
                phone: data.phone || null,
                city: data.city || null,
                neighborhood: data.neighborhood || null,
                employment_status: data.employment_status || 'unemployed',
                domain_expertise: data.domain_expertise || [],
                education: data.education || null,
                side_activities: data.side_activities || null,
                role: 'prestataire',
                status: 'active',
                verification_status: data.verification_status || 'none',
                id_document_type: data.id_document_type || null,
                profile_photo_url: profilePhotoUrl,
                id_document_url: idDocumentUrl
            };
            
            const { data: insertData, error: insertError } = await supabaseClient
                .from('users')
                .insert(profileData)
                .select();
            
            if (insertError) {
                console.error('❌ Erreur insertion profil:', insertError);
                
                if (insertError.message.includes('duplicate key') && insertError.message.includes('username')) {
                    throw new Error('Ce nom d\'utilisateur est déjà pris. Veuillez en choisir un autre.');
                }
                
                throw new Error('Erreur lors de la création du profil : ' + insertError.message);
            }
            
            console.log('✅✅✅ INSCRIPTION RÉUSSIE ! ✅✅✅');
            console.log('Profil créé:', insertData);
            
            // Afficher le message de succès
            showAlert('✅ Inscription réussie ! Redirection vers votre tableau de bord...', 'success');
            
            // Cacher le bouton submit
            if (submitBtn) submitBtn.style.display = 'none';
            
            // Rediriger après 2 secondes
            setTimeout(() => {
                window.location.href = 'dashboard/index.html';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erreur inscription:', error);
            showAlert(error.message || 'Une erreur inattendue est survenue.', 'error');
            setButtonLoading(submitBtn, false);
        }
        
        return false;
    });
    
    // ═══════════════ INITIALISATION ═══════════════
    updateUI();
    
    // Vérifier si déjà connecté
    async function checkSession() {
        const { data } = await supabaseClient.auth.getSession();
        if (data.session) {
            showAlert('Vous êtes déjà connecté. Redirection...', 'info');
            setTimeout(() => {
                window.location.href = 'dashboard/index.html';
            }, 1500);
        }
    }
    
    checkSession();
    
    console.log('✅✅✅ Formulaire d\'inscription PRÊT ✅✅✅');
    console.log('Étape actuelle:', currentStep);
    console.log('Boutons - Prev:', !!prevBtn, 'Next:', !!nextBtn, 'Submit:', !!submitBtn);
});