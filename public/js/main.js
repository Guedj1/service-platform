// Scripts basiques pour améliorer l'UX
document.addEventListener('DOMContentLoaded', function() {
    // Animation des formulaires
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Traitement...';
                
                // Réactiver après 3s au cas où
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.original || 'Envoyer';
                }, 3000);
            }
        });
    });
    
    // Messages d'alerte améliorés
    if (window.location.search.includes('success')) {
        showAlert('Opération réussie!', 'success');
    }
    if (window.location.search.includes('error')) {
        showAlert('Une erreur est survenue', 'error');
    }
});

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}
