const API_BASE = window.location.origin;

// Vérifier l'authentification
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
            alert('Cette page est réservée aux prestataires');
            window.location.href = '/dashboard';
            return false;
        }
        
        return true;
    } catch (error) {
        window.location.href = '/login';
        return false;
    }
}

// Charger les services du prestataire
async function loadMyServices() {
    try {
        const response = await fetch(`${API_BASE}/api/services/mes-services/liste`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            displayMyServices(data.services);
            updateStats(data.services);
        } else {
            showError('Erreur de chargement');
        }
    } catch (error) {
        showError('Erreur de connexion');
    }
}

// Afficher les services
function displayMyServices(services) {
    const container = document.getElementById('myServicesList');
    
    if (services.length === 0) {
        container.innerHTML = `
            <div class="no-services">
                <i class="fas fa-tools"></i>
                <h3>Vous n'avez pas encore de services</h3>
                <p>Créez votre premier service pour commencer à recevoir des demandes</p>
                <a href="/create-service" class="btn-primary">Créer un service</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = services.map(service => `
        <div class="service-card my-service" data-id="${service._id}">
            <div class="service-header">
                <h3>${service.titre}</h3>
                <span class="service-status ${service.disponible ? 'status-active' : 'status-inactive'}">
                    ${service.disponible ? 'Actif' : 'Inactif'}
                </span>
            </div>
            <p class="service-description">${service.description}</p>
            <div class="service-details">
                <span class="service-category">
                    <i class="fas fa-tag"></i> ${service.categorie}
                </span>
                <span class="service-price">
                    <i class="fas fa-money-bill-wave"></i> ${service.prix} FCFA
                </span>
                <span class="service-date">
                    <i class="fas fa-calendar"></i> ${new Date(service.dateCreation).toLocaleDateString('fr-FR')}
                </span>
            </div>
            <div class="service-actions">
                <button class="btn-edit" onclick="openEditModal('${service._id}')">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn-toggle ${service.disponible ? 'btn-deactivate' : 'btn-activate'}" 
                        onclick="toggleService('${service._id}', ${service.disponible})">
                    <i class="fas ${service.disponible ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    ${service.disponible ? 'Désactiver' : 'Activer'}
                </button>
                <button class="btn-delete" onclick="deleteService('${service._id}')">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

// Mettre à jour les statistiques
function updateStats(services) {
    const total = services.length;
    const active = services.filter(s => s.disponible).length;
    const revenue = services.reduce((sum, s) => sum + (s.disponible ? s.prix : 0), 0);
    
    document.getElementById('totalServices').textContent = total;
    document.getElementById('activeServices').textContent = active;
    document.getElementById('totalRevenue').textContent = revenue.toLocaleString();
}

// Ouvrir modal d'édition
async function openEditModal(serviceId) {
    try {
        const response = await fetch(`${API_BASE}/api/services/${serviceId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            const service = data.service;
            document.getElementById('editServiceId').value = service._id;
            document.getElementById('editTitre').value = service.titre;
            document.getElementById('editDescription').value = service.description;
            document.getElementById('editPrix').value = service.prix;
            document.getElementById('editDisponible').value = service.disponible;
            
            document.getElementById('editModal').style.display = 'block';
        }
    } catch (error) {
        alert('Erreur de chargement');
    }
}

// Fermer modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Enregistrer les modifications
document.getElementById('editServiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const serviceId = document.getElementById('editServiceId').value;
    const formData = {
        titre: document.getElementById('editTitre').value,
        description: document.getElementById('editDescription').value,
        prix: parseInt(document.getElementById('editPrix').value),
        disponible: document.getElementById('editDisponible').value === 'true'
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/services/${serviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Service modifié avec succès');
            closeEditModal();
            loadMyServices();
        } else {
            alert(data.message || 'Erreur');
        }
    } catch (error) {
        alert('Erreur de connexion');
    }
});

// Activer/Désactiver un service
async function toggleService(serviceId, currentStatus) {
    if (confirm(`Voulez-vous vraiment ${currentStatus ? 'désactiver' : 'activer'} ce service ?`)) {
        try {
            const response = await fetch(`${API_BASE}/api/services/${serviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    disponible: !currentStatus
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                loadMyServices();
            } else {
                alert(data.message || 'Erreur');
            }
        } catch (error) {
            alert('Erreur de connexion');
        }
    }
}

// Supprimer un service
async function deleteService(serviceId) {
    if (confirm('Voulez-vous vraiment supprimer ce service ? Cette action est irréversible.')) {
        try {
            const response = await fetch(`${API_BASE}/api/services/${serviceId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Service supprimé avec succès');
                loadMyServices();
            } else {
                alert(data.message || 'Erreur');
            }
        } catch (error) {
            alert('Erreur de connexion');
        }
    }
}

// Gestion de la déconnexion
document.getElementById('logoutBtn').addEventListener('click', async function() {
    if (confirm('Voulez-vous vous déconnecter ?')) {
        try {
            const response = await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await response.json();
            if (data.success) {
                window.location.href = '/';
            }
        } catch (error) {
            window.location.href = '/';
        }
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    if (await checkAuth()) {
        loadMyServices();
        
        // Filtres
        document.getElementById('filterStatus').addEventListener('change', filterServices);
        document.getElementById('searchMyServices').addEventListener('input', filterServices);
    }
});

function filterServices() {
    // Implémentation simple du filtrage
    const statusFilter = document.getElementById('filterStatus').value;
    const searchText = document.getElementById('searchMyServices').value.toLowerCase();
    
    // Recharger avec filtres
    loadMyServices();
}

function showError(message) {
    document.getElementById('myServicesList').innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>${message}</h3>
        </div>
    `;
}
