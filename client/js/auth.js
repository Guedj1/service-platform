// Configuration de l'API
const API_BASE_URL = window.location.origin.includes('github.io') 
    ? 'https://servicesn-platform.onrender.com/api' 
    : '/api';

// Afficher/Masquer le mot de passe
function setupPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
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

// Charger les données de connexion automatiquement
function loadSavedCredentials() {
    if (document.getElementById('loginForm')) {
        const savedEmail = localStorage.getItem('servicen_email');
        const savedRemember = localStorage.getItem('servicen_remember') === 'true';
        
        if (savedEmail && savedRemember) {
            document.getElementById('email').value = savedEmail;
            document.getElementById('rememberMe').checked = true;
        }
    }
}

// Sauvegarder les données de connexion
function saveCredentials(email, remember) {
    if (remember) {
        localStorage.setItem('servicen_email', email);
        localStorage.setItem('servicen_remember', 'true');
    } else {
        localStorage.removeItem('servicen_email');
        localStorage.removeItem('servicen_remember');
    }
}

// Gestion de l'inscription
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const registerText = document.getElementById('registerText');
    const registerLoading = document.getElementById('registerLoading');
    
    setupPasswordToggle();
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validation du mot de passe
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showAlert('Les mots de passe ne correspondent pas', 'error');
            return;
        }
        
        if (password.length < 6) {
            showAlert('Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }
        
        // Récupération des données
        const formData = {
            nom: document.getElementById('nom').value,
            prenom: document.getElementById('prenom').value,
            email: document.getElementById('email').value,
            telephone: document.getElementById('telephone').value,
            role: document.getElementById('role').value,
            password: password
        };
        
        // Validation des champs requis
        if (!formData.role) {
            showAlert('Veuillez sélectionner votre rôle', 'error');
            return;
        }
        
        // Affichage du chargement
        registerText.style.display = 'none';
        registerLoading.style.display = 'block';
        registerBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important pour les sessions
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert(data.message, 'success');
                
                // Sauvegarde des données de connexion
                localStorage.setItem('servicen_user', JSON.stringify(data.user));
                
                // Redirection vers le dashboard
                setTimeout(() => {
                    window.location.href = data.redirect || '/dashboard';
                }, 1500);
                
            } else {
                showAlert(data.message || 'Erreur lors de l\'inscription', 'error');
                if (data.errors) {
                    console.error('Erreurs de validation:', data.errors);
                }
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            showAlert('Erreur de connexion au serveur. Vérifiez votre connexion internet.', 'error');
            
        } finally {
            // Réinitialisation du bouton
            registerText.style.display = 'block';
            registerLoading.style.display = 'none';
            registerBtn.disabled = false;
        }
    });
}

// Gestion de la connexion
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginLoading = document.getElementById('loginLoading');
    
    setupPasswordToggle();
    loadSavedCredentials();
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
        
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Sauvegarde des données de connexion
        saveCredentials(formData.email, rememberMe);
        
        // Affichage du chargement
        loginText.style.display = 'none';
        loginLoading.style.display = 'block';
        loginBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important pour les sessions
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert(data.message, 'success');
                
                // Sauvegarde des données utilisateur
                localStorage.setItem('servicen_user', JSON.stringify(data.user));
                
                // Redirection vers le dashboard
                setTimeout(() => {
                    window.location.href = data.redirect || '/dashboard';
                }, 1500);
                
            } else {
                showAlert(data.message || 'Identifiants incorrects', 'error');
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            showAlert('Erreur de connexion au serveur. Vérifiez votre connexion internet.', 'error');
            
        } finally {
            // Réinitialisation du bouton
            loginText.style.display = 'block';
            loginLoading.style.display = 'none';
            loginBtn.disabled = false;
        }
    });
}

// Vérification de l'authentification
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/check-auth`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.isAuthenticated && window.location.pathname.includes('/login')) {
            // Si déjà connecté, rediriger vers le dashboard
            window.location.href = '/dashboard';
        } else if (!data.isAuthenticated && window.location.pathname.includes('/dashboard')) {
            // Si non connecté sur dashboard, rediriger vers login
            window.location.href = '/login';
        }
        
        return data;
        
    } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error);
        return { isAuthenticated: false };
    }
}

// Vérifier l'authentification au chargement
document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('/login') && 
        !window.location.pathname.includes('/register')) {
        checkAuth();
    }
});
