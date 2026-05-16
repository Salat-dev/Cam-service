// ═══════════════════════════════════════════
// SERVICE-REGISTRATION.JS — Complet & Corrigé
// ═══════════════════════════════════════════

var SUPABASE_URL = 'https://cwubxwbzzuigctvgdygv.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';
var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

var currentStep = 1, totalSteps = 4;
var currentUser = null;
var selectedDays = [];
var uploadedImageUrl = null;
var isUploading = false;

// ═══════════ INIT ═══════════
(async function init() {
    lucide.createIcons();
    await checkAuth();
    loadDraft();
    updateUI();
    setupListeners();
})();

async function checkAuth() {
    var { data } = await sb.auth.getSession();
    if (!data.session) { window.location.href = '../login.html'; return; }
    var { data: profile } = await sb.from('users').select('*').eq('id', data.session.user.id).single();
    currentUser = profile || { id: data.session.user.id };
}

// ═══════════ NAVIGATION ═══════════
function updateUI() {
    document.querySelectorAll('.form-step').forEach(function(el, i) {
        el.classList.toggle('active', i + 1 === currentStep);
    });
    document.querySelectorAll('.progress-step').forEach(function(el, i) {
        el.classList.remove('active', 'done');
        if (i + 1 < currentStep) el.classList.add('done');
        if (i + 1 === currentStep) el.classList.add('active');
    });
    document.querySelector('.progress-bar-fill').style.width = ((currentStep - 1) / (totalSteps - 1) * 100) + '%';

    document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'inline-flex';
    document.getElementById('nextBtn').style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
    document.getElementById('submitBtn').style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
    document.getElementById('draftBtn').style.display = currentStep > 1 ? 'inline-flex' : 'none';

    updateStepIcons();
    hideAlert();
    if (currentStep === 4) updateSummary();
}

function updateStepIcons() {
    var icons = ['info', 'image', 'calendar', 'check'];
    document.querySelectorAll('.step-dot').forEach(function(dot, i) {
        if (i + 1 < currentStep) dot.innerHTML = '<i data-lucide="check" style="width:.9rem;height:.9rem"></i>';
        else dot.innerHTML = '<i data-lucide="' + icons[i] + '" style="width:.9rem;height:.9rem"></i>';
    });
    lucide.createIcons();
}

function validateStep(step) {
    var el = document.querySelector('.form-step[data-step="' + step + '"]');
    var required = el.querySelectorAll('[required]');
    var ok = true;
    required.forEach(function(f) {
        if (!f.value || !f.value.trim()) {
            ok = false;
            f.style.borderColor = 'var(--red)';
            f.style.boxShadow = '0 0 0 3px rgba(220,38,38,.1)';
            setTimeout(function() {
                f.style.borderColor = 'var(--rule)';
                f.style.boxShadow = 'none';
            }, 2000);
        }
    });

    // Validation email à l'étape 1
    if (step === 1) {
        var email = el.querySelector('[name="email"]');
        if (email && email.value && email.value.indexOf('@') === -1) {
            showAlert('Veuillez entrer une adresse email valide.', 'error');
            return false;
        }
    }

    if (!ok) showAlert('Remplissez tous les champs obligatoires.', 'error');
    return ok;
}

// ═══════════ LISTENERS ═══════════
function setupListeners() {
    document.getElementById('nextBtn').addEventListener('click', function() {
        if (validateStep(currentStep) && currentStep < totalSteps) {
            currentStep++;
            updateUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById('prevBtn').addEventListener('click', function() {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById('exitBtn').addEventListener('click', showExitModal);
    document.getElementById('draftBtn').addEventListener('click', saveDraft);
    document.getElementById('serviceForm').addEventListener('submit', handleSubmit);

    // Pricing type toggle
    var pricingType = document.getElementById('pricingType');
    if (pricingType) {
        pricingType.addEventListener('change', function() {
            document.getElementById('durationGroup').style.display = ['hourly', 'daily'].includes(this.value) ? 'block' : 'none';
        });
    }

    // Image URL preview
    var imageUrlInput = document.getElementById('imageUrlInput');
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', function() {
            var url = this.value.trim();
            if (url) showImagePreview(url);
        });
    }

    // File upload preview
    var imageFile = document.getElementById('imageFile');
    if (imageFile) {
        imageFile.addEventListener('change', function() {
            if (this.files[0]) {
                // Afficher le nom du fichier
                var preview = document.getElementById('uploadPreview');
                if (preview) {
                    preview.style.display = 'flex';
                    preview.innerHTML = '<i data-lucide="check-circle" style="width:1rem;height:1rem;color:var(--green);flex-shrink:0"></i> <span>' + this.files[0].name + '</span>';
                    lucide.createIcons();
                }
                // Afficher la preview
                var reader = new FileReader();
                reader.onload = function(e) { showImagePreview(e.target.result); };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Days selection
    document.querySelectorAll('.agenda-day').forEach(function(day) {
        day.addEventListener('click', function() {
            this.classList.toggle('selected');
            selectedDays = [];
            document.querySelectorAll('.agenda-day.selected').forEach(function(d) {
                selectedDays.push(d.dataset.day);
            });
            var workingDaysInput = document.getElementById('workingDays');
            if (workingDaysInput) workingDaysInput.value = JSON.stringify(selectedDays);
        });
    });
}

// ═══════════ IMAGE PREVIEW ═══════════
function showImagePreview(url) {
    var container = document.getElementById('imagePreviewContainer');
    var img = document.getElementById('imagePreview');
    if (container && img) {
        container.style.display = 'block';
        img.src = url;
        img.onerror = function() {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="%23E8E2DA"><rect width="200" height="150"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23C9C2B8" font-size="14">Image non disponible</text></svg>';
        };
    }
}

// ═══════════ ALERT ═══════════
function showAlert(msg, type) {
    var a = document.getElementById('formAlert');
    if (!a) return;
    a.innerHTML = '<i data-lucide="' + (type === 'error' ? 'alert-circle' : 'check-circle') + '" style="width:1rem;height:1rem;flex-shrink:0"></i> <span>' + msg + '</span>';
    a.className = 'alert ' + type;
    a.style.display = 'flex';
    lucide.createIcons();
}

function hideAlert() {
    var a = document.getElementById('formAlert');
    if (a) { a.style.display = 'none'; a.className = 'alert'; }
}

// ═══════════ UPLOAD IMAGE ═══════════
async function uploadImage(file) {
    if (!file) return null;

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert("L'image ne doit pas dépasser 5 Mo.", 'error');
        return null;
    }

    // Vérifier le type
    var allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.indexOf(file.type) === -1) {
        showAlert('Format accepté : JPG, PNG, WebP.', 'error');
        return null;
    }

    // Générer un nom unique
    var ext = file.name.split('.').pop();
    var fileName = Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.' + ext;

    try {
        console.log('📤 Upload image vers service-images...');
        var { data, error } = await sb.storage
            .from('service-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ Erreur upload:', error);
            throw error;
        }

        console.log('✅ Upload réussi:', data);

        // Récupérer l'URL publique
        var { data: urlData } = sb.storage
            .from('service-images')
            .getPublicUrl(fileName);

        console.log('🔗 URL publique:', urlData.publicUrl);
        return urlData.publicUrl;

    } catch (err) {
        console.error("❌ Upload failed:", err);
        showAlert("Erreur lors de l'upload de l'image. Vérifiez votre connexion.", 'error');
        return null;
    }
}

// ═══════════ DRAFT ═══════════
function saveDraft() {
    var data = getFormData();
    localStorage.setItem('service_draft', JSON.stringify(data));
    showAlert('✅ Brouillon enregistré ! Vous pourrez le reprendre plus tard.', 'success');
    setTimeout(function() {
        window.location.href = '../dashboard/services.html';
    }, 1500);
}

function loadDraft() {
    var draft = localStorage.getItem('service_draft');
    if (!draft) return;
    try {
        var data = JSON.parse(draft);
        if (data.title && document.querySelector('[name="title"]')) document.querySelector('[name="title"]').value = data.title || '';
        if (data.category && document.querySelector('[name="category"]')) document.querySelector('[name="category"]').value = data.category || '';
        if (data.pricing_type && document.querySelector('[name="pricing_type"]')) document.querySelector('[name="pricing_type"]').value = data.pricing_type || 'fixed';
        if (data.price && document.querySelector('[name="price"]')) document.querySelector('[name="price"]').value = data.price || '';
        if (data.description && document.querySelector('[name="description"]')) document.querySelector('[name="description"]').value = data.description || '';
        if (data.image_url && document.querySelector('[name="image_url"]')) document.querySelector('[name="image_url"]').value = data.image_url || '';
        if (data.duration_hours && document.querySelector('[name="duration_hours"]')) document.querySelector('[name="duration_hours"]').value = data.duration_hours || '';
        if (data.working_days) {
            selectedDays = JSON.parse(data.working_days);
            document.querySelectorAll('.agenda-day').forEach(function(d) {
                if (selectedDays.includes(d.dataset.day)) d.classList.add('selected');
            });
        }
        if (data.time_start && document.getElementById('timeStart')) document.getElementById('timeStart').value = data.time_start;
        if (data.time_end && document.getElementById('timeEnd')) document.getElementById('timeEnd').value = data.time_end;
        showAlert('📝 Un brouillon a été chargé. Continuez ou modifiez.', 'success');
    } catch (e) {
        console.warn('Erreur chargement brouillon:', e);
    }
}

function getFormData() {
    return {
        title: (document.querySelector('[name="title"]') || {}).value || '',
        category: (document.querySelector('[name="category"]') || {}).value || '',
        pricing_type: (document.querySelector('[name="pricing_type"]') || {}).value || '',
        price: (document.querySelector('[name="price"]') || {}).value || '',
        description: (document.querySelector('[name="description"]') || {}).value || '',
        image_url: (document.querySelector('[name="image_url"]') || {}).value || '',
        duration_hours: (document.querySelector('[name="duration_hours"]') || {}).value || '',
        working_days: JSON.stringify(selectedDays),
        time_start: (document.getElementById('timeStart') || {}).value || '',
        time_end: (document.getElementById('timeEnd') || {}).value || ''
    };
}

// ═══════════ EXIT MODAL ═══════════
function showExitModal() {
    document.getElementById('exitModalContainer').innerHTML = `
        <div class="exit-modal-overlay" onclick="if(event.target===this)closeExitModal()">
            <div class="exit-modal">
                <h3><i data-lucide="log-out" style="width:1.2rem;height:1.2rem;color:var(--red)"></i> Quitter sans publier ?</h3>
                <p>Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?</p>
                <div class="exit-modal-actions">
                    <button class="btn btn-primary" onclick="closeExitModal();document.getElementById('nextBtn').click()">
                        <i data-lucide="arrow-right" style="width:1rem;height:1rem"></i> Continuer à remplir
                    </button>
                    <button class="btn btn-save-draft" onclick="saveDraft();closeExitModal()">
                        <i data-lucide="save" style="width:1rem;height:1rem"></i> Enregistrer le brouillon
                    </button>
                    <button class="btn btn-ghost" onclick="closeExitModal();window.location.href='../dashboard/services.html'">
                        <i data-lucide="trash-2" style="width:1rem;height:1rem"></i> Quitter sans enregistrer
                    </button>
                </div>
            </div>
        </div>`;
    lucide.createIcons();
}

function closeExitModal() {
    document.getElementById('exitModalContainer').innerHTML = '';
}

// ═══════════ SUMMARY ═══════════
function updateSummary() {
    var data = getFormData();
    var sumTitle = document.getElementById('sumTitle');
    var sumCategory = document.getElementById('sumCategory');
    var sumPrice = document.getElementById('sumPrice');
    var sumImage = document.getElementById('sumImage');
    var sumDays = document.getElementById('sumDays');
    var sumHours = document.getElementById('sumHours');

    if (sumTitle) sumTitle.textContent = data.title || '—';
    if (sumCategory) sumCategory.textContent = data.category || '—';
    if (sumPrice) sumPrice.textContent = data.price ? parseInt(data.price).toLocaleString('fr-FR') + ' FCFA' : '—';
    if (sumImage) sumImage.textContent = data.image_url || uploadedImageUrl || 'Aucune';
    if (sumDays) sumDays.textContent = selectedDays.length > 0 ? selectedDays.join(', ') : 'Non défini';
    if (sumHours) sumHours.textContent = (data.time_start && data.time_end) ? data.time_start + ' → ' + data.time_end : 'Non défini';
}

// ═══════════ SUBMIT ═══════════
async function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep(4)) return;

    var btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite;margin-right:6px"></span> Publication...';

    try {
        // ✅ Upload image si fichier présent
        var imageFile = (document.getElementById('imageFile') || {}).files?.[0];
        if (imageFile && imageFile.size > 0) {
            showAlert('📤 Upload de l\'image en cours...', 'success');
            uploadedImageUrl = await uploadImage(imageFile);
            if (!uploadedImageUrl) {
                showAlert("L'upload a échoué. L'URL saisie sera utilisée.", 'error');
            }
        }

        var formData = getFormData();
        var serviceData = {
            user_id: currentUser.id,
            title: formData.title,
            category: formData.category,
            pricing_type: formData.pricing_type,
            price: parseFloat(formData.price) || 0,
            description: formData.description || null,
            image_url: uploadedImageUrl || formData.image_url || null,
            duration_minutes: formData.duration_hours ? parseInt(formData.duration_hours * 60) : null,
            working_days: selectedDays.length > 0 ? selectedDays : null,
            time_start: formData.time_start || null,
            time_end: formData.time_end || null,
            is_active: true
        };

        console.log('💾 Données à insérer:', serviceData);

        var { data, error } = await sb.from('services').insert(serviceData).select();

        if (error) {
            console.error('❌ Erreur insertion:', error);
            throw error;
        }

        console.log('✅ Service créé:', data);

        localStorage.removeItem('service_draft');
        showAlert('✅ Service publié avec succès ! Redirection...', 'success');
        setTimeout(function() {
            window.location.href = '../dashboard/services.html';
        }, 1500);

    } catch (err) {
        console.error('❌ Erreur:', err);
        var message = err.message || 'Une erreur est survenue.';
        if (err.code === '23505') message = 'Un service avec ce titre existe déjà.';
        if (err.code === '23503') message = 'Erreur de profil. Reconnectez-vous.';
        showAlert(message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="check" style="width:1rem;height:1rem"></i> Publier le service';
        lucide.createIcons();
    }
}