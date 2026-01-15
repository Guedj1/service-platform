// Configuration
const API_BASE = window.location.origin;

// Vérifier l'authentification et le rôle
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/check`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.isAuthenticated) {
            window.location.href = '/login';
            return false;
        }
        
        if (data.user.role !== 'prestataire') {
            showAlert('Seuls les prestataires peuvent créer des services', 'error');
            setTimeout(() => window.location.href = '/dashboard', 2000);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur vérification auth:', error);
        window.location.href = '/login';
        return false;
    }
}

// Afficher une alerte
function showAlert(message, type = 'success') {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.textContent = message;
    alertDiv.className = `alert ${type}`;
    alertDiv.style.display = 'block';
    
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

// Gérer la soumission du formulaire
document.getElementById('createServiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Vérifier l'authentification
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;
    
    // Récupérer les données
    const formData = {
        titre: document.getElementById('titre').value,
        description: document.getElementById('description').value,
        categorie: document.getElementById('categorie').value,
        prix: parseInt(document.getElementById('prix').value),
        localisation: document.getElementById('localisation').value
    };
    
    // Gérer les images si fournies
    const imagesInput = document.getElementById('images').value;
    if (imagesInput.trim()) {
        formData.images = imagesInput.split(',').map(url => url.trim()).filter(url => url);
    }
    
    // Validation
    if (formData.titre.length > 100) {
        showAlert('Le titre ne peut pas dépasser 100 caractères', 'error');
        return;
    }
    
    if (formData.description.length > 500) {
        showAlert('La description ne peut pas dépasser 500 caractères', 'error');
        return;
    }
    
    if (formData.prix < 0) {
        showAlert('Le prix ne peut pas être négatif', 'error');
        return;
    }
    
    // Afficher le chargement
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoading = document.getElementById('submitLoading');
    
    submitText.style.display = 'none';
    submitLoading.style.display = 'block';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/api/services`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Service créé avec succès !', 'success');
            
            // Redirection vers le dashboard après 2 secondes
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
            
        } else {
            showAlert(data.message || 'Erreur lors de la création', 'error');
            if (data.errors) {
                console.error('Erreurs de validation:', data.errors);
            }
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur de connexion au serveur', 'error');
        
    } finally {
        // Réinitialiser le bouton
        submitText.style.display = 'block';
        submitLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        window.location.href = '/login';
    }
});
