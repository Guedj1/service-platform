#!/bin/bash

# Fichier source
SOURCE="server/server.js"
BACKUP="${SOURCE}.backup.$(date +%s)"

# Sauvegarde
cp "$SOURCE" "$BACKUP"
echo "✅ Backup créé: $BACKUP"

# Reconstruire avec toutes les fonctionnalités
cat > "$SOURCE" << 'SERVERCODE'
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// ========== CONFIGURATION ==========
console.log('🔧 ServiceN Platform - Démarrage...');

// Connexion MongoDB avec gestion d'erreur
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    })
    .then(() => console.log('✅ MongoDB connecté'))
    .catch(err => {
        console.warn('⚠️  MongoDB non disponible:', err.message);
        console.log('Mode sans base de données activé');
    });
} else {
    console.log('⚠️  MONGODB_URI non défini');
}

// ========== MIDDLEWARE ==========

// CORS pour ton écosystème
app.use(cors({
    origin: [
        'https://servicesn-platform.onrender.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://192.168.1.128:3333'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy trust pour Render
app.set('trust proxy', 1);

// Sessions (uniquement si MongoDB est disponible)
if (mongoose.connection.readyState === 1) {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'serviceN-secret-key-12345',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            ttl: 14 * 24 * 60 * 60 // 14 jours
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7 // 1 semaine
        }
    }));
    console.log('✅ Sessions activées avec MongoDB');
} else {
    // Sessions en mémoire (fallback)
    app.use(session({
        secret: process.env.SESSION_SECRET || 'serviceN-secret-key-12345',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    }));
    console.log('✅ Sessions activées (mémoire)');
}

// ========== ROUTES STATIQUES ==========
app.use(express.static(path.join(__dirname, '../client')));

// ========== ROUTES PRINCIPALES ==========

// 1. PAGE D'ACCUEIL
app.get('/', (req, res) => {
    res.send(\`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ServiceN Platform - Accueil</title>
            <style>
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 40px;
                    min-height: 100vh;
                    color: white;
                    text-align: center;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: rgba(255,255,255,0.1);
                    padding: 40px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                }
                h1 { font-size: 3em; margin-bottom: 20px; }
                .btn {
                    display: inline-block;
                    padding: 15px 30px;
                    margin: 10px;
                    background: white;
                    color: #667eea;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: bold;
                    transition: 0.3s;
                }
                .btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 ServiceN Platform</h1>
                <p>Plateforme professionnelle de création et gestion de services</p>
                
                <div style="margin: 40px 0;">
                    <a href="/create-service?v=4" class="btn">
                        📝 Créer un service
                    </a>
                    <a href="/login" class="btn">
                        🔐 Se connecter
                    </a>
                    <a href="/register" class="btn">
                        📋 S'inscrire
                    </a>
                    <a href="/dashboard" class="btn">
                        📊 Tableau de bord
                    </a>
                </div>
                
                <div style="margin-top: 40px; opacity: 0.8;">
                    <p>Dashboard local: <a href="http://192.168.1.128:3333" style="color: #fff;">192.168.1.128:3333</a></p>
                </div>
            </div>
        </body>
        </html>
    \`);
});

// 2. PAGE DE CONNEXION
app.get('/login', (req, res) => {
    res.send(\`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Connexion - ServiceN</title>
            <style>
                body { font-family: Arial; padding: 40px; max-width: 400px; margin: 0 auto; }
                .form-card { background: #f5f5f5; padding: 30px; border-radius: 10px; }
                input { width: 100%; padding: 12px; margin: 10px 0; }
                button { background: #4CAF50; color: white; padding: 15px; width: 100%; border: none; }
            </style>
        </head>
        <body>
            <h1>Connexion</h1>
            <div class="form-card">
                <form action="/api/auth/login" method="POST">
                    <input type="email" name="email" placeholder="Email" required>
                    <input type="password" name="password" placeholder="Mot de passe" required>
                    <button type="submit">Se connecter</button>
                </form>
                <p><a href="/register">Pas de compte ? S'inscrire</a></p>
            </div>
        </body>
        </html>
    \`);
});

// 3. PAGE D'INSCRIPTION
app.get('/register', (req, res) => {
    res.send(\`
        <h1>Inscription</h1>
        <form action="/api/auth/register" method="POST">
            <input name="nom" placeholder="Nom" required>
            <input name="prenom" placeholder="Prénom" required>
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Mot de passe" required>
            <button type="submit">S'inscrire</button>
        </form>
    \`);
});

// 4. FORMULAIRE CREATE-SERVICE (COMPLET)
app.get('/create-service', (req, res) => {
    // Vérifier la session
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    res.send(\`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Créer un service - ServiceN</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background: #f0f2f5;
                    margin: 0;
                    padding: 20px;
                }
                .form-container {
                    max-width: 700px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 5px 25px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #333;
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #4CAF50;
                    padding-bottom: 15px;
                }
                .form-group {
                    margin-bottom: 25px;
                }
                label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: bold;
                    color: #555;
                }
                input, textarea, select {
                    width: 100%;
                    padding: 14px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                    box-sizing: border-box;
                    transition: border 0.3s;
                }
                input:focus, textarea:focus, select:focus {
                    border-color: #4CAF50;
                    outline: none;
                }
                textarea {
                    min-height: 150px;
                    resize: vertical;
                }
                .submit-btn {
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white;
                    padding: 18px;
                    border: none;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                    transition: 0.3s;
                    margin-top: 20px;
                }
                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 7px 20px rgba(76, 175, 80, 0.3);
                }
                .back-link {
                    display: block;
                    text-align: center;
                    margin-top: 25px;
                    color: #667eea;
                    text-decoration: none;
                    font-weight: bold;
                }
                .price-input {
                    display: flex;
                    align-items: center;
                }
                .price-input input {
                    flex: 1;
                }
                .price-input span {
                    margin-left: 10px;
                    font-weight: bold;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="form-container">
                <h1>🚀 Créer un nouveau service</h1>
                
                <form id="createServiceForm" action="/api/services/create" method="POST">
                    <div class="form-group">
                        <label for="title">Titre du service *</label>
                        <input type="text" id="title" name="title" 
                               placeholder="Ex: Développement d'application web" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="description">Description détaillée *</label>
                        <textarea id="description" name="description" 
                                  placeholder="Décrivez votre service en détail... Ex: Je développe des applications web modernes avec React, Node.js et MongoDB..."
                                  required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="category">Catégorie *</label>
                        <select id="category" name="category" required>
                            <option value="">-- Sélectionnez une catégorie --</option>
                            <option value="informatique">💻 Informatique & Développement</option>
                            <option value="design">🎨 Design Graphique</option>
                            <option value="marketing">📈 Marketing Digital</option>
                            <option value="redaction">✍️ Rédaction & Traduction</option>
                            <option value="consulting">💼 Consulting Business</option>
                            <option value="formation">🎓 Formation & Coaching</option>
                            <option value="audiovisuel">🎬 Audio-visuel</option>
                            <option value="autre">🔧 Autre</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="price">Prix (FCFA) *</label>
                        <div class="price-input">
                            <input type="number" id="price" name="price" 
                                   placeholder="Ex: 50000" min="1000" step="1000" required>
                            <span>FCFA</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="delai">Délai de livraison (jours) *</label>
                        <input type="number" id="delai" name="delai" 
                               placeholder="Ex: 7" min="1" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="competences">Compétences requises</label>
                        <input type="text" id="competences" name="competences" 
                               placeholder="Ex: React, Node.js, MongoDB (séparées par des virgules)">
                    </div>
                    
                    <button type="submit" class="submit-btn">
                        📤 Publier le service
                    </button>
                </form>
                
                <a href="/dashboard" class="back-link">← Retour au tableau de bord</a>
            </div>
            
            <script>
                document.getElementById('createServiceForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(this);
                    const submitBtn = this.querySelector('.submit-btn');
                    const originalText = submitBtn.textContent;
                    
                    // Animation du bouton
                    submitBtn.textContent = 'Publication en cours...';
                    submitBtn.disabled = true;
                    
                    try {
                        const response = await fetch(this.action, {
                            method: 'POST',
                            body: new URLSearchParams(formData),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('✅ Service créé avec succès !');
                            this.reset();
                        } else {
                            alert('❌ Erreur: ' + (result.message || 'Impossible de créer le service'));
                        }
                    } catch (error) {
                        alert('❌ Erreur de connexion au serveur');
                        console.error('Erreur:', error);
                    } finally {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }
                });
            </script>
        </body>
        </html>
    \`);
});

// 5. DASHBOARD
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    res.send(\`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Tableau de bord - ServiceN</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                .dashboard { max-width: 1000px; margin: 0 auto; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
                .stat-card { background: #667eea; color: white; padding: 20px; border-radius: 10px; }
                .menu { display: flex; gap: 15px; margin: 20px 0; }
                .menu a { padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <h1>📊 Tableau de bord</h1>
                <p>Bienvenue sur votre espace personnel</p>
                
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
                    <a href="/create-service">Créer un service</a>
                    <a href="/mes-services">Mes services</a>
                    <a href="/profile">Mon profil</a>
                    <a href="/logout">Déconnexion</a>
                </div>
            </div>
        </body>
        </html>
    \`);
});

// 6. API ROUTES (SIMULATION)
app.post('/api/auth/login', (req, res) => {
    // Simulation d'authentification
    req.session.userId = 'user_' + Date.now();
    req.session.email = req.body.email || 'utilisateur@example.com';
    req.session.role = 'prestataire';
    
    res.json({ 
        success: true, 
        message: 'Connexion réussie',
        redirect: '/dashboard'
    });
});

app.post('/api/auth/register', (req, res) => {
    req.session.userId = 'user_' + Date.now();
    req.session.email = req.body.email;
    req.session.nom = req.body.nom;
    req.session.prenom = req.body.prenom;
    req.session.role = 'prestataire';
    
    res.json({ 
        success: true, 
        message: 'Inscription réussie',
        redirect: '/dashboard'
    });
});

app.post('/api/services/create', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    
    const { title, description, price, category } = req.body;
    console.log('Nouveau service créé:', { title, price, category, userId: req.session.userId });
    
    res.json({ 
        success: true, 
        message: \`Service "\${title}" créé avec succès!\`,
        serviceId: 'SVC_' + Date.now()
    });
});

// 7. ROUTE FALLBACK
app.get('*', (req, res) => {
    res.status(404).send(\`
        <h1>404 - Page non trouvée</h1>
        <p>La page que vous recherchez n'existe pas.</p>
        <a href="/">Retour à l'accueil</a>
    \`);
});

// ========== DÉMARRAGE ==========
app.listen(PORT, () => {
    console.log(\`\\n🎉 SERVICE N PLATFORM - PRÊT À L'EMPLOI\\n\`);
    console.log(\`✅ Serveur démarré sur le port \${PORT}\`);
    console.log(\`🌐 Environnement: \${process.env.NODE_ENV || 'development'}\`);
    console.log(\`🔗 URL locale: http://localhost:\${PORT}\`);
    console.log(\`🔗 URL Render: https://servicesn-platform.onrender.com\`);
    console.log(\`🔗 Dashboard local: http://192.168.1.128:3333\\n\`);
    console.log(\`📋 Routes disponibles:\`);
    console.log(\`   • GET  /               - Page d'accueil\`);
    console.log(\`   • GET  /login          - Connexion\`);
    console.log(\`   • GET  /register       - Inscription\`);
    console.log(\`   • GET  /create-service - Formulaire création\`);
    console.log(\`   • GET  /dashboard      - Tableau de bord\`);
    console.log(\`   • POST /api/auth/login - API connexion\`);
    console.log(\`   • POST /api/services/create - API création service\\n\`);
});
SERVERCODE

echo "✅ server.js reconstruit avec toutes les fonctionnalités"
echo "📁 Backup conservé: $BACKUP"
