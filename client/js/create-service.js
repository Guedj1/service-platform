const API_BASE = window.location.origin;

async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/check`, {credentials: 'include'});
        const data = await response.json();
        
        if (!data.isAuthenticated) {
            window.location.href = '/login';
            return false;
        }
        
        if (data.user.role !== 'prestataire') {
            alert('Seuls les prestataires peuvent créer des services');
            window.location.href = '/dashboard';
            return false;
        }
        
        return true;
    } catch (error) {
        window.location.href = '/login';
        return false;
    }
}

function showAlert(message, type = 'success') {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.textContent = message;
    alertDiv.className = `alert ${type}`;
    alertDiv.style.display = 'block';
    
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

document.getElementById('createServiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!await checkAuth()) return;
    
    const formData = {
        titre: document.getElementById('titre').value,
        description: document.getElementById('description').value,
        categorie: document.getElementById('categorie').value,
        prix: parseInt(document.getElementById('prix').value),
        localisation: document.getElementById('localisation').value
    };
    
    const imagesInput = document.getElementById('images').value;
    if (imagesInput.trim()) {
        formData.images = imagesInput.split(',').map(url => url.trim()).filter(url => url);
    }
    
    // Afficher chargement
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoading = document.getElementById('submitLoading');
    
    submitText.style.display = 'none';
    submitLoading.style.display = 'block';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/api/services`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Service créé avec succès !', 'success');
            setTimeout(() => window.location.href = '/dashboard', 2000);
        } else {
            showAlert(data.message || 'Erreur', 'error');
        }
        
    } catch (error) {
        showAlert('Erreur de connexion', 'error');
    } finally {
        submitText.style.display = 'block';
        submitLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
});

// Vérifier auth au chargement
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        window.location.href = '/login';
    }
});
