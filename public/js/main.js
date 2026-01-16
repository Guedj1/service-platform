// ServiceN Platform - JavaScript principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('ServiceN Platform - Chargé');
    
    // Gestion des formulaires
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
                
                // Pour les formulaires API
                if (this.action.includes('/api/')) {
                    e.preventDefault();
                    handleApiForm(this, submitBtn, originalText);
                }
            }
        });
    });
    
    // Animation des cartes
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .stat-card, .action-card').forEach(card => {
        observer.observe(card);
    });
});

// Gestion des formulaires API
async function handleApiForm(form, submitBtn, originalText) {
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        const response = await fetch(form.action, {
            method: form.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message || 'Succès !', 'success');
            
            if (result.redirect) {
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 1500);
            }
        } else {
            showNotification(result.message || 'Une erreur est survenue', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion au serveur', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Système de notification
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Bouton fermer
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-fermeture
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .feature-card, .stat-card, .action-card {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s ease;
    }
    .feature-card.animate-in,
    .stat-card.animate-in,
    .action-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    .fa-spinner {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
