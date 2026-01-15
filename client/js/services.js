// API base URL
const API_BASE = window.location.origin;

// Charger les services
async function loadServices() {
    try {
        const response = await fetch(`${API_BASE}/api/services`);
        const data = await response.json();
        
        if (data.success) {
            displayServices(data.services);
        } else {
            document.getElementById('servicesList').innerHTML = 
                '<div class="error">Erreur de chargement des services</div>';
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('servicesList').innerHTML = 
            '<div class="error">Impossible de charger les services</div>';
    }
}

// Afficher les services
function displayServices(services) {
    const container = document.getElementById('servicesList');
    
    if (services.length === 0) {
        container.innerHTML = `
            <div class="no-services">
                <i class="fas fa-search"></i>
                <h3>Aucun service disponible pour le moment</h3>
                <p>Soyez le premier à proposer un service !</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = services.map(service => `
        <div class="service-card">
            <div class="service-header">
                <h3>${service.titre}</h3>
                <span class="service-price">${service.prix} FCFA</span>
            </div>
            <p class="service-description">${service.description}</p>
            <div class="service-details">
                <span class="service-category">
                    <i class="fas fa-tag"></i> ${service.categorie}
                </span>
                <span class="service-location">
                    <i class="fas fa-map-marker-alt"></i> ${service.localisation}
                </span>
            </div>
            <div class="service-footer">
                <button class="btn-contact" onclick="contactService('${service._id}')">
                    <i class="fas fa-envelope"></i> Contacter
                </button>
                <button class="btn-details" onclick="viewServiceDetails('${service._id}')">
                    <i class="fas fa-eye"></i> Détails
                </button>
            </div>
        </div>
    `).join('');
}

// Filtrer les services
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    let timeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            filterServices();
        }, 300);
    });
    
    categoryFilter.addEventListener('change', filterServices);
}

// Fonction de filtrage
async function filterServices() {
    const search = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;
    
    let url = `${API_BASE}/api/services?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `categorie=${encodeURIComponent(category)}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            displayServices(data.services);
        }
    } catch (error) {
        console.error('Erreur filtrage:', error);
    }
}

// Voir les détails d'un service
function viewServiceDetails(serviceId) {
    window.location.href = `/service.html?id=${serviceId}`;
}

// Contacter pour un service
function contactService(serviceId) {
    // Rediriger vers WhatsApp ou formulaire de contact
    window.open(`/contact/whatsapp?service=${serviceId}`, '_blank');
}

// Au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    setupFilters();
});
