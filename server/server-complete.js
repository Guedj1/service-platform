require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 ServiceN Platform - Système complet');

// ========== CONFIGURATION MONGODB ==========
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicen';

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => {
    console.warn('⚠️  MongoDB non disponible:', err.message);
    console.log('Mode développement sans base de données');
});

// ========== MODÈLES MONGODB ==========
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    telephone: String,
    role: { type: String, default: 'prestataire' },
    createdAt: { type: Date, default: Date.now }
});

const serviceSchema = new mongoose.Schema({
    titre: { type: String, required: true },
    description: { type: String, required: true },
    prix: { type: Number, required: true },
    categorie: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    statut: { type: String, default: 'actif' }
});

const User = mongoose.model('User', userSchema);
const Service = mongoose.model('Service', serviceSchema);

// ========== MIDDLEWARE ==========
app.use(cors({
    origin: [
        'https://servicesn-platform.onrender.com',
        'http://localhost:3000',
        'http://localhost:3003',
        'http://192.168.1.128:3333'
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

app.set('trust proxy', 1);

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'servicen-secret-prod-2024',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 14 * 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// ========== MIDDLEWARE PERSO ==========
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// ========== ROUTES PAGES ==========

// 1. PAGE D'ACCUEIL COMPLÈTE
app.get('/', (req, res) => {
    const isLoggedIn = !!req.session.userId;
    
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ServiceN Platform - Accueil</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                }
                .navbar {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    backdrop-filter: blur(10px);
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .nav-links {
                    display: flex;
                    gap: 20px;
                }
                .nav-links a {
                    color: white;
                    text-decoration: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    transition: 0.3s;
                }
                .nav-links a:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .hero {
                    text-align: center;
                    padding: 100px 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .hero h1 {
                    font-size: 3.5em;
                    margin-bottom: 20px;
                }
                .hero p {
                    font-size: 1.2em;
                    opacity: 0.9;
                    margin-bottom: 40px;
                }
                .cta-buttons {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin-top: 40px;
                }
                .btn {
                    padding: 18px 36px;
                    border-radius: 10px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 1.1em;
                    transition: 0.3s;
                }
                .btn-primary {
                    background: white;
                    color: #667eea;
                }
                .btn-secondary {
                    background: transparent;
                    color: white;
                    border: 2px solid white;
                }
                .btn:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 30px;
                    padding: 80px 40px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .feature-card {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 30px;
                    border-radius: 15px;
                    text-align: center;
                    backdrop-filter: blur(10px);
                }
                .feature-icon {
                    font-size: 3em;
                    margin-bottom: 20px;
                }
                .user-status {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <nav class="navbar">
                <div class="logo">
                    <span>🚀</span>
                    ServiceN Platform
                </div>
                <div class="nav-links">
                    ${isLoggedIn ? 
                        `<a href="/dashboard">Tableau de bord</a>
                         <a href="/create-service">Créer service</a>
                         <a href="/logout">Déconnexion</a>` :
                        `<a href="/login">Connexion</a>
                         <a href="/register">Inscription</a>`
                    }
                </div>
            </nav>
            
            <div class="hero">
                <h1>Créez, Gérez, Vendez vos Services</h1>
                <p>La plateforme tout-en-un pour les prestataires de services. 
                   Démarrez gratuitement et développez votre activité en ligne.</p>
                
                <div class="cta-buttons">
                    ${isLoggedIn ? 
                        `<a href="/create-service" class="btn btn-primary">📝 Créer un service</a>
                         <a href="/dashboard" class="btn btn-secondary">📊 Mon dashboard</a>` :
                        `<a href="/register" class="btn btn-primary">🚀 Commencer gratuitement</a>
                         <a href="/login" class="btn btn-secondary">🔐 Se connecter</a>`
                    }
                </div>
                
                ${isLoggedIn ? 
                    `<div class="user-status">
                        <p>✅ Connecté en tant que ${req.session.email || 'utilisateur'}</p>
                    </div>` : ''
                }
            </div>
            
            <div class="features">
                <div class="feature-card">
                    <div class="feature-icon">💼</div>
                    <h3>Création simple</h3>
                    <p>Créez votre service en quelques minutes avec notre formulaire intuitif</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💰</div>
                    <h3>Gestion des revenus</h3>
                    <p>Suivez vos transactions et revenus en temps réel</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">👥</div>
                    <h3>Clients satisfaits</h3>
                    <p>Augmentez votre réputation avec notre système d'avis</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📱</div>
                    <h3>Multi-plateforme</h3>
                    <p>Accédez depuis n'importe quel appareil</p>
                </div>
            </div>
            
            <footer style="text-align: center; padding: 40px; opacity: 0.7;">
                <p>© 2024 ServiceN Platform - Développé avec passion</p>
                <p>Dashboard local: <a href="http://192.168.1.128:3333" style="color: white;">192.168.1.128:3333</a></p>
            </footer>
        </body>
        </html>
    `);
});

// 2. PAGE D'INSCRIPTION COMPLÈTE
app.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inscription - ServiceN</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .form-container {
                    background: white;
                    width: 100%;
                    max-width: 500px;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                h1 {
                    color: #333;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: bold;
                    color: #555;
                }
                input {
                    width: 100%;
                    padding: 14px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                    box-sizing: border-box;
                }
                button {
                    background: #4CAF50;
                    color: white;
                    padding: 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    width: 100%;
                    cursor: pointer;
                    margin-top: 10px;
                }
                .login-link {
                    text-align: center;
                    margin-top: 20px;
                }
                .error {
                    color: #f44336;
                    background: #ffebee;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    display: none;
                }
            </style>
        </head>
        <body>
            <div class="form-container">
                <h1>📋 Créer votre compte</h1>
                
                <div id="errorMessage" class="error"></div>
                
                <form id="registerForm">
                    <div class="form-group">
                        <label>Nom *</label>
                        <input type="text" name="nom" placeholder="Votre nom" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Prénom *</label>
                        <input type="text" name="prenom" placeholder="Votre prénom" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" placeholder="votre@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="tel" name="telephone" placeholder="+221 77 123 45 67">
                    </div>
                    
                    <div class="form-group">
                        <label>Mot de passe *</label>
                        <input type="password" name="password" placeholder="••••••••" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label>Confirmer le mot de passe *</label>
                        <input type="password" name="confirmPassword" placeholder="••••••••" required>
                    </div>
                    
                    <button type="submit">Créer mon compte</button>
                </form>
                
                <div class="login-link">
                    <p>Déjà un compte ? <a href="/login">Se connecter</a></p>
                    <p><a href="/">← Retour à l'accueil</a></p>
                </div>
            </div>
            
            <script>
                document.getElementById('registerForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(this);
                    const password = formData.get('password');
                    const confirmPassword = formData.get('confirmPassword');
                    const errorDiv = document.getElementById('errorMessage');
                    
                    // Validation
                    if (password !== confirmPassword) {
                        errorDiv.textContent = 'Les mots de passe ne correspondent pas';
                        errorDiv.style.display = 'block';
                        return;
                    }
                    
                    if (password.length < 6) {
                        errorDiv.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
                        errorDiv.style.display = 'block';
                        return;
                    }
                    
                    errorDiv.style.display = 'none';
                    
                    // Envoyer les données
                    try {
                        const response = await fetch('/api/auth/register', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(Object.fromEntries(formData))
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('✅ Compte créé avec succès !');
                            window.location.href = result.redirect || '/dashboard';
                        } else {
                            errorDiv.textContent = result.message || 'Erreur lors de l\'inscription';
                            errorDiv.style.display = 'block';
                        }
                    } catch (error) {
                        errorDiv.textContent = 'Erreur de connexion au serveur';
                        errorDiv.style.display = 'block';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// 3. PAGE DE CONNEXION COMPLÈTE
app.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Connexion - ServiceN</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .form-container {
                    background: white;
                    width: 100%;
                    max-width: 400px;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                h1 {
                    color: #333;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                input {
                    width: 100%;
                    padding: 14px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                    box-sizing: border-box;
                }
                button {
                    background: #4CAF50;
                    color: white;
                    padding: 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    width: 100%;
                    cursor: pointer;
                }
                .links {
                    text-align: center;
                    margin-top: 20px;
                }
                .error {
                    color: #f44336;
                    background: #ffebee;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    display: none;
                }
            </style>
        </head>
        <body>
            <div class="form-container">
                <h1>🔐 Connexion</h1>
                
                <div id="errorMessage" class="error"></div>
                
                <form id="loginForm">
                    <div class="form-group">
                        <input type="email" name="email" placeholder="Email" required>
                    </div>
                    
                    <div class="form-group">
                        <input type="password" name="password" placeholder="Mot de passe" required>
                    </div>
                    
                    <button type="submit">Se connecter</button>
                </form>
                
                <div class="links">
                    <p><a href="/register">Pas encore de compte ? S'inscrire</a></p>
                    <p><a href="/">← Retour à l'accueil</a></p>
                </div>
            </div>
            
            <script>
                document.getElementById('loginForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(this);
                    const errorDiv = document.getElementById('errorMessage');
                    
                    try {
                        const response = await fetch('/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(Object.fromEntries(formData))
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            window.location.href = result.redirect || '/dashboard';
                        } else {
                            errorDiv.textContent = result.message || 'Email ou mot de passe incorrect';
                            errorDiv.style.display = 'block';
                        }
                    } catch (error) {
                        errorDiv.textContent = 'Erreur de connexion au serveur';
                        errorDiv.style.display = 'block';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// 4. FORMULAIRE CREATE-SERVICE (EXISTANT - À GARDER)
app.get('/create-service', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Créer Service - ServiceN</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; }
                button { background: #4CAF50; color: white; padding: 12px; border: none; width: 100%; }
            </style>
        </head>
        <body>
            <h1>📝 Créer un service</h1>
            <p>Connecté en tant que: ${req.session.email || 'Utilisateur'}</p>
            <form action="/api/services/create" method="POST">
                <div class="form-group">
                    <label>Titre *</label>
                    <input type="text" name="title" required>
                </div>
                <div class="form-group">
                    <label>Description *</label>
                    <textarea name="description" rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label>Prix (FCFA) *</label>
                    <input type="number" name="price" required>
                </div>
                <div class="form-group">
                    <label>Catégorie</label>
                    <select name="category">
                        <option value="informatique">Informatique</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                    </select>
                </div>
                <button type="submit">Publier le service</button>
            </form>
            <p><a href="/dashboard">← Retour au dashboard</a></p>
        </body>
        </html>
    `);
});

// 5. DASHBOARD
app.get('/dashboard', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dashboard - ServiceN</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                .dashboard { max-width: 1000px; margin: 0 auto; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
                .stat-card { background: #667eea; color: white; padding: 20px; border-radius: 10px; }
                .menu { display: flex; gap: 15px; margin: 20px 0; }
                .menu a { padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <h1>📊 Tableau de bord</h1>
                <p>Bienvenue ${req.session.prenom || 'Utilisateur'} !</p>
                <p>Email: ${req.session.email || ''}</p>
                
                <div class="stats">
                    <div class="stat-card">
                        <h3>Services actifs</h3>
                        <p>0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Revenus totaux</h3>
                        <p>0 FCFA</p>
                    </div>
                    <div class="stat-card">
                        <h3>Clients</h3>
                        <p>0</p>
                    </div>
                </div>
                
                <div class="menu">
                    <a href="/create-service">📝 Créer un service</a>
                    <a href="/mes-services">📋 Mes services</a>
                    <a href="/profile">👤 Mon profil</a>
                    <a href="/logout">🚪 Déconnexion</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 6. DÉCONNEXION
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ========== API ROUTES ==========

// API - Inscription
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, prenom, email, password, telephone } = req.body;
        
        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'Cet email est déjà utilisé' });
        }
        
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer l'utilisateur
        const user = new User({
            nom,
            prenom,
            email,
            password: hashedPassword,
            telephone,
            role: 'prestataire'
        });
        
        await user.save();
        
        // Créer la session
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.nom = user.nom;
        req.session.prenom = user.prenom;
        req.session.role = user.role;
        
        res.json({ 
            success: true, 
            message: 'Inscription réussie !',
            redirect: '/dashboard'
        });
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.json({ success: false, message: 'Erreur lors de l\'inscription' });
    }
});

// API - Connexion
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Chercher l'utilisateur
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
        
        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
        
        // Créer la session
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.nom = user.nom;
        req.session.prenom = user.prenom;
        req.session.role = user.role;
        
        res.json({ 
            success: true, 
            message: 'Connexion réussie !',
            redirect: '/dashboard'
        });
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.json({ success: false, message: 'Erreur lors de la connexion' });
    }
});

// API - Créer service
app.post('/api/services/create', requireAuth, async (req, res) => {
    try {
        const { title, description, price, category } = req.body;
        
        const service = new Service({
            titre: title,
            description,
            prix: price,
            categorie: category,
            userId: req.session.userId
        });
        
        await service.save();
        
        res.json({ 
            success: true, 
            message: `Service "${title}" créé avec succès!`,
            serviceId: service._id
        });
        
    } catch (error) {
        console.error('Erreur création service:', error);
        res.json({ success: false, message: 'Erreur lors de la création du service' });
    }
});

// API - Récupérer services utilisateur
app.get('/api/services/my-services', requireAuth, async (req, res) => {
    try {
        const services = await Service.find({ userId: req.session.userId });
        res.json({ success: true, services });
    } catch (error) {
        res.json({ success: false, message: 'Erreur de récupération' });
    }
});

// ========== DÉMARRAGE ==========
app.listen(PORT, () => {
    console.log(\`\\n🎉 SERVICE N PLATFORM - SYSTÈME COMPLET\\n\`);
    console.log(\`✅ Serveur démarré sur le port \${PORT}\`);
    console.log(\`🌐 Environnement: \${process.env.NODE_ENV || 'development'}\`);
    console.log(\`🔗 URL locale: http://localhost:\${PORT}\`);
    console.log(\`🔗 URL Render: https://servicesn-platform.onrender.com\`);
    console.log(\`🔗 Dashboard local: http://192.168.1.128:3333\\n\`);
    console.log(\`📋 Routes disponibles:\`);
    console.log(\`   • GET  /               - Page d'accueil\`);
    console.log(\`   • GET  /register       - Inscription\`);
    console.log(\`   • GET  /login          - Connexion\`);
    console.log(\`   • GET  /create-service - Création service\`);
    console.log(\`   • GET  /dashboard      - Tableau de bord\`);
    console.log(\`   • POST /api/auth/*     - API authentification\`);
    console.log(\`   • POST /api/services/* - API services\\n\`);
});
