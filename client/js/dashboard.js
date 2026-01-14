// Configuration de l'API
const API_BASE_URL = window.location.origin.includes('github.io') 
    ? 'https://servicesn-platform.onrender.com/api' 
    : '/api';

// Charger les données utilisateur
async function loadUserData() {
    try {
        // Vérifier l'authentification
        const authResponse = await fetch(`${API_BASE_URL}/auth/check-auth`, {
            credentials: 'include'
        });
        
        const authData = await authResponse.json();
        
        if (!authData.isAuthenticated) {
            window.location.href = '/login';
            return;
        }
        
        // Afficher le message de bienvenue
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement && authData.user) {
            welcomeElement.textContent = `Bonjour, ${authData.user.prenom} ${authData.user.nom}`;
        }
        
        // Charger les statistiques
        await loadDashboardStats();
        
        // Charger les services récents
        await loadRecentServices();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showAlert('Erreur de chargement des données', 'error');
    }
}

// Charger les statistiques du dashboard
async function loadDashboardStats() {
    try {
        // Simuler des données pour l'instant
        // À remplacer par un appel API réel plus tard
        document.getElementById('servicesCount').textContent = '3';
        document.getElementById('rating').textContent = '4.8';
        document.getElementById('clientsCount').textContent = '24';
        
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Charger les services récents
async function loadRecentServices() {
    const servicesList = document.getElementById('recentServices');
    if (!servicesList) return;
    
    try {
        // Simuler des données pour l'instant
        // À remplacer par un appel API réel plus tard
        const services = [
            { id: 1, title: 'Réparation plomberie', date: '2024-01-15', status: 'Terminé' },
            { id: 2, title: 'Cours de mathématiques', date: '2024-01-14', status: 'En cours' },
            { id: 3, title: 'Installation électrique', date: '2024-01-13', status: 'Terminé' }
        ];
        
        servicesList.innerHTML = services.map(service => `
            <div class="service-item">
                <div class="service-info">
                    <h4>${service.title}</h4>
                    <p>Date: ${service.date}</p>
                </div>
                <span class="service-status ${service.status === 'Terminé' ? 'status-completed' : 'status-pending'}">
                    ${service.status}
                </span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
        servicesList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur de chargement des services</p>
            </div>
        `;
    }
}

// Gestion de la déconnexion
function setupLogout() {
    const logoutButtons = document.querySelectorAll('#logoutBtn, #logoutBtnMobile');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', async function() {
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Supprimer les données locales
                        localStorage.removeItem('servicen_user');
                        localStorage.removeItem('servicen_email');
                        localStorage.removeItem('servicen_remember');
                        
                        // Redirection
                        window.location.href = data.redirect || '/';
                    }
                    
                } catch (error) {
                    console.error('Erreur lors de la déconnexion:', error);
                    showAlert('Erreur lors de la déconnexion', 'error');
                }
            }
        });
    });
}

// Afficher un message d'alerte
function showAlert(message, type = 'success') {
    const alertDiv = document.getElementById('alertMessage');
    if (!alertDiv) return;
    
    alertDiv.textContent = message;
    alertDiv.className = `alert ${type}`;
    alertDiv.style.display = 'block';
    
    // Auto-hide après 5 secondes
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

// Gestion du menu mobile
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarMobile = document.getElementById('sidebarMobile');
    
    if (menuToggle && sidebarMobile) {
        menuToggle.addEventListener('click', function() {
            sidebarMobile.classList.add('active');
            // Créer un overlay
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay active';
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', function() {
                sidebarMobile.classList.remove('active');
                overlay.remove();
            });
        });
    }
    
    if (closeSidebar && sidebarMobile) {
        closeSidebar.addEventListener('click', function() {
            sidebarMobile.classList.remove('active');
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) overlay.remove();
        });
    }
}

// Initialisation du dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    setupLogout();
    setupMobileMenu();
    
    // Vérifier périodiquement l'authentification
    setInterval(() => {
        fetch(`${API_BASE_URL}/auth/check-auth`, { credentials: 'include' })
            .catch(() => {
                // En cas d'erreur, vérifier si on est toujours sur le dashboard
                if (window.location.pathname.includes('/dashboard')) {
                    window.location.href = '/login';
                }
            });
    }, 300000); // Toutes les 5 minutes
});
