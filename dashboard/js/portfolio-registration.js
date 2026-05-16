var SUPABASE_URL = 'https://cwubxwbzzuigctvgdygv.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJ4d2J6enVpZ2N0dmdkeWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzI2MTgsImV4cCI6MjA5MzgwODYxOH0.0mwBNo_S5yItQQjq2at9GNRN74ooZRBJIbZGDH9L2uk';
var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

var currentStep = 1, totalSteps = 3;
var currentUser = null;
var uploadedMediaUrl = null;

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

function updateUI() {
    document.querySelectorAll('.form-step').forEach(function(el, i) { el.classList.toggle('active', i+1 === currentStep); });
    document.querySelectorAll('.progress-step').forEach(function(el, i) {
        el.classList.remove('active','done');
        if (i+1 < currentStep) el.classList.add('done');
        if (i+1 === currentStep) el.classList.add('active');
    });
    document.querySelector('.progress-bar-fill').style.width = ((currentStep-1)/(totalSteps-1)*100)+'%';
    document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'inline-flex';
    document.getElementById('nextBtn').style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
    document.getElementById('submitBtn').style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
    document.getElementById('draftBtn').style.display = currentStep > 1 ? 'inline-flex' : 'none';
    updateStepIcons();
    hideAlert();
    if (currentStep === 3) updateSummary();
}

function updateStepIcons() {
    var icons = ['info','image','check'];
    document.querySelectorAll('.step-dot').forEach(function(dot, i) {
        dot.innerHTML = i+1 < currentStep ? '<i data-lucide="check" style="width:.9rem;height:.9rem"></i>' : '<i data-lucide="'+icons[i]+'" style="width:.9rem;height:.9rem"></i>';
    });
    lucide.createIcons();
}

function validateStep(step) {
    var el = document.querySelector('.form-step[data-step="'+step+'"]');
    var required = el.querySelectorAll('[required]'); var ok = true;
    required.forEach(function(f) {
        if (!f.value.trim()) { ok = false; f.style.borderColor = 'var(--red)'; setTimeout(function(){f.style.borderColor='var(--rule)';},2000); }
    });
    if (!ok) showAlert('Remplissez tous les champs obligatoires.', 'error');
    return ok;
}

function setupListeners() {
    document.getElementById('nextBtn').addEventListener('click', function() {
        if (validateStep(currentStep) && currentStep < totalSteps) { currentStep++; updateUI(); }
    });
    document.getElementById('prevBtn').addEventListener('click', function() { if (currentStep > 1) { currentStep--; updateUI(); } });
    document.getElementById('exitBtn').addEventListener('click', showExitModal);
    document.getElementById('draftBtn').addEventListener('click', saveDraft);
    document.getElementById('portfolioForm').addEventListener('submit', handleSubmit);

    var mediaUrlInput = document.getElementById('mediaUrlInput');
    if (mediaUrlInput) mediaUrlInput.addEventListener('input', function() { var url = this.value.trim(); if (url) showImagePreview(url); });

    var mediaFile = document.getElementById('mediaFile');
    if (mediaFile) {
        mediaFile.addEventListener('change', function() {
            if (this.files[0]) {
                var preview = document.getElementById('uploadPreview');
                if (preview) { preview.style.display = 'flex'; preview.innerHTML = '<i data-lucide="check-circle" style="width:1rem;height:1rem;color:var(--green)"></i> '+this.files[0].name; lucide.createIcons(); }
                var reader = new FileReader();
                reader.onload = function(e) { showImagePreview(e.target.result); };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

function showImagePreview(url) {
    var container = document.getElementById('imagePreviewContainer');
    var img = document.getElementById('imagePreview');
    if (container && img) { container.style.display = 'block'; img.src = url; }
}

function showAlert(msg, type) {
    var a = document.getElementById('formAlert');
    if (!a) return;
    a.innerHTML = '<i data-lucide="'+(type==='error'?'alert-circle':'check-circle')+'" style="width:1rem;height:1rem"></i> '+msg;
    a.className = 'alert '+type; a.style.display='flex'; lucide.createIcons();
}
function hideAlert() { var a = document.getElementById('formAlert'); if (a) { a.style.display='none'; a.className='alert'; } }

async function uploadMedia(file) {
    if (!file || file.size === 0) return null;
    if (file.size > 5*1024*1024) { showAlert("Fichier trop volumineux (max 5 Mo).", 'error'); return null; }
    var ext = file.name.split('.').pop();
    var fileName = 'portfolio_'+Date.now()+'_'+Math.random().toString(36).substring(2,8)+'.'+ext;
    try {
        var { error } = await sb.storage.from('service-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (error) throw error;
        var { data: urlData } = sb.storage.from('service-images').getPublicUrl(fileName);
        return urlData.publicUrl;
    } catch (err) {
        console.error('Upload failed:', err);
        showAlert("Erreur lors de l'upload.", 'error');
        return null;
    }
}

function saveDraft() {
    var data = getFormData();
    localStorage.setItem('portfolio_draft', JSON.stringify(data));
    showAlert('✅ Brouillon enregistré !', 'success');
    setTimeout(function() { window.location.href = '../dashboard/portfolio.html'; }, 1500);
}

function loadDraft() {
    var draft = localStorage.getItem('portfolio_draft');
    if (!draft) return;
    try {
        var data = JSON.parse(draft);
        if (data.title) document.querySelector('[name="title"]').value = data.title;
        if (data.category) document.querySelector('[name="category"]').value = data.category;
        if (data.media_type) document.querySelector('[name="media_type"]').value = data.media_type;
        if (data.media_url) document.querySelector('[name="media_url"]').value = data.media_url;
        if (data.description) document.querySelector('[name="description"]').value = data.description;
        if (data.tags) document.querySelector('[name="tags"]').value = data.tags;
        if (data.is_featured) document.querySelector('[name="is_featured"]').checked = true;
        showAlert('📝 Brouillon chargé.', 'success');
    } catch(e) {}
}

function getFormData() {
    return {
        title: document.querySelector('[name="title"]')?.value || '',
        category: document.querySelector('[name="category"]')?.value || '',
        media_type: document.querySelector('[name="media_type"]')?.value || 'image',
        media_url: document.querySelector('[name="media_url"]')?.value || '',
        description: document.querySelector('[name="description"]')?.value || '',
        tags: document.querySelector('[name="tags"]')?.value || '',
        is_featured: document.querySelector('[name="is_featured"]')?.checked || false
    };
}

function updateSummary() {
    var data = getFormData();
    document.getElementById('sumTitle').textContent = data.title || '—';
    document.getElementById('sumCategory').textContent = data.category || '—';
    document.getElementById('sumType').textContent = data.media_type === 'video' ? 'Vidéo' : 'Image';
    document.getElementById('sumMedia').textContent = data.media_url || uploadedMediaUrl || 'Aucun';
    document.getElementById('sumFeatured').textContent = data.is_featured ? '⭐ Oui' : 'Non';
}

function showExitModal() {
    document.getElementById('exitModalContainer').innerHTML = `
        <div class="exit-modal-overlay" onclick="if(event.target===this)closeExitModal()">
            <div class="exit-modal">
                <h3><i data-lucide="log-out" style="width:1.2rem;height:1.2rem;color:var(--red)"></i> Quitter sans publier ?</h3>
                <p>Vous avez des modifications non enregistrées.</p>
                <div class="exit-modal-actions">
                    <button class="btn btn-primary" onclick="closeExitModal();document.getElementById('nextBtn').click()"><i data-lucide="arrow-right" style="width:1rem;height:1rem"></i> Continuer</button>
                    <button class="btn btn-save-draft" onclick="saveDraft();closeExitModal()"><i data-lucide="save" style="width:1rem;height:1rem"></i> Enregistrer le brouillon</button>
                    <button class="btn btn-ghost" onclick="closeExitModal();window.location.href='../dashboard/portfolio.html'"><i data-lucide="trash-2" style="width:1rem;height:1rem"></i> Quitter sans enregistrer</button>
                </div>
            </div>
        </div>`;
    lucide.createIcons();
}
function closeExitModal() { document.getElementById('exitModalContainer').innerHTML = ''; }

async function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep(3)) return;
    var btn = document.getElementById('submitBtn');
    btn.disabled = true; btn.innerHTML = 'Publication...';

    try {
        var mediaFile = document.getElementById('mediaFile')?.files?.[0];
        if (mediaFile && mediaFile.size > 0) {
            uploadedMediaUrl = await uploadMedia(mediaFile);
        }

        var formData = getFormData();
        var tagsArray = formData.tags ? formData.tags.split(',').map(function(t){return t.trim();}).filter(function(t){return t;}) : [];

        var itemData = {
            user_id: currentUser.id,
            title: formData.title,
            category: formData.category || null,
            media_type: formData.media_type || 'image',
            media_url: uploadedMediaUrl || formData.media_url,
            description: formData.description || null,
            tags: tagsArray.length > 0 ? tagsArray : null,
            is_featured: formData.is_featured || false,
            display_order: 0
        };

        var { error } = await sb.from('portfolio_items').insert(itemData);
        if (error) throw error;

        localStorage.removeItem('portfolio_draft');
        showAlert('✅ Réalisation publiée ! Redirection...', 'success');
        setTimeout(function() { window.location.href = '../dashboard/portfolio.html'; }, 1500);
    } catch (err) {
        console.error('❌', err);
        showAlert('Erreur : ' + err.message, 'error');
        btn.disabled = false; btn.innerHTML = '<i data-lucide="check" style="width:1rem;height:1rem"></i> Publier';
        lucide.createIcons();
    }
}
