require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();

// PORT pour Render (utilise process.env.PORT, sinon 3000 en local)
const PORT = process.env.PORT || 3000;

console.log('🚀 ServiceN Platform - Version Render Optimisée');
console.log('📊 Port:', PORT);
console.log('🌐 NODE_ENV:', process.env.NODE_ENV || 'development');

// MongoDB - IMPORTANT: utiliser la variable Render
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicen';

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.log('⚠️  MongoDB:', err.message));

// ========== CONFIGURATION RENDER ==========

// CORS - autoriser toutes les origines pour le moment
app.use(cors({
    origin: true,  // Accepter toutes les origines
    credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Configuration session spéciale pour Render
app.set('trust proxy', 1);  // Important pour Render

const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'render-session-secret-2024',
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
};

// Désactiver le store si MongoDB n'est pas disponible
if (!process.env.MONGODB_URI) {
    delete sessionConfig.store;
    console.log('⚠️  Mode session sans MongoDB (mémoire)');
}

app.use(session(sessionConfig));

// ========== MODÈLES ==========
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
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Service = mongoose.model('Service', serviceSchema);

// ========== MIDDLEWARE ==========
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// ========== ROUTES SIMPLES MAIS FONCTIONNELLES ==========

// 1. PAGE D'ACCUEIL - TOUJOURS RÉPONDRE
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
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 0;
                    color: white;
                    min-height: 100vh;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    text-align: center;
                }
                h1 {
                    font-size: 3em;
                    margin-bottom: 20px;
                }
                .btn {
                    display: inline-block;
                    padding: 15px 30px;
                    margin: 10px;
                    background: white;
                    color: #667eea;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: bold;
                    font-size: 1.1em;
                }
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 40px 0;
                }
                .feature {
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 10px;
                }
                .status {
                    background: rgba(255,255,255,0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 ServiceN Platform</h1>
                <p style="font-size: 1.2em;">Plateforme professionnelle de services</p>
                
                <div class="features">
                    <div class="feature">
                        <h3>📝 Création</h3>
                        <p>Créez vos services facilement</p>
                    </div>
                    <div class="feature">
                        <h3>💰 Gestion</h3>
                        <p>Suivez vos revenus</p>
                    </div>
                    <div class="feature">
                        <h3>👥 Clients</h3>
                        <p>Développez votre clientèle</p>
                    </div>
                </div>
                
                <div>
                    ${isLoggedIn ? 
                        `<a href="/dashboard" class="btn">📊 Tableau de bord</a>
                         <a href="/create-service" class="btn">📝 Créer un service</a>` 
                        : 
                        `<a href="/register" class="btn">📋 S'inscrire</a>
                         <a href="/login" class="btn">🔐 Se connecter</a>`
                    }
                </div>
                
                <div class="status">
                    <p>✅ Serveur actif sur Render | Port: ${PORT}</p>
                    <p>👤 ${isLoggedIn ? `Connecté: ${req.session.email}` : 'Non connecté'}</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 2. INSCRIPTION
app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inscription - ServiceN</title>
            <style>
                body { font-family: Arial; padding: 40px; max-width: 400px; margin: 0 auto; }
                input { width: 100%; padding: 12px; margin: 10px 0; }
                button { background: #4CAF50; color: white; padding: 15px; width: 100%; border: none; }
            </style>
        </head>
        <body>
            <h1>Inscription</h1>
            <form action="/api/auth/register" method="POST">
                <input name="nom" placeholder="Nom" required>
                <input name="prenom" placeholder="Prénom" required>
                <input type="email" name="email" placeholder="Email" required>
                <input type="password" name="password" placeholder="Mot de passe" required>
                <button type="submit">S'inscrire</button>
            </form>
            <p><a href="/login">Déjà un compte ?</a> | <a href="/">Accueil</a></p>
        </body>
        </html>
    `);
});

// 3. CONNEXION
app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Connexion - ServiceN</title></head>
        <body>
            <h1>Connexion</h1>
            <form action="/api/auth/login" method="POST">
                <input type="email" name="email" placeholder="Email" required>
                <input type="password" name="password" placeholder="Mot de passe" required>
                <button type="submit">Se connecter</button>
            </form>
            <p><a href="/register">Pas de compte ?</a> | <a href="/">Accueil</a></p>
        </body>
        </html>
    `);
});

// 4. CREATE-SERVICE (PAGE IMPORTANTE)
app.get('/create-service', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Créer Service - ServiceN</title>
            <style>
                body { font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto; }
                input, textarea, select { width: 100%; padding: 10px; margin: 5px 0; }
                button { background: #4CAF50; color: white; padding: 12px; width: 100%; border: none; }
            </style>
        </head>
        <body>
            <h1>📝 Créer un service</h1>
            <p>Connecté: ${req.session.email}</p>
            <form action="/api/services/create" method="POST">
                <input type="text" name="title" placeholder="Titre" required>
                <textarea name="description" placeholder="Description" rows="4" required></textarea>
                <input type="number" name="price" placeholder="Prix FCFA" required>
                <select name="category">
                    <option value="informatique">Informatique</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                </select>
                <button type="submit">Publier</button>
            </form>
            <p><a href="/dashboard">← Retour</a></p>
        </body>
        </html>
    `);
});

// 5. DASHBOARD
app.get('/dashboard', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Dashboard - ServiceN</title></head>
        <body>
            <h1>📊 Tableau de bord</h1>
            <p>Bienvenue ${req.session.prenom || 'Utilisateur'}!</p>
            <p>Email: ${req.session.email}</p>
            <p><a href="/create-service">Créer un service</a></p>
            <p><a href="/logout">Déconnexion</a></p>
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
        const { nom, prenom, email, password } = req.body;
        
        // Vérifier si email existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'Email déjà utilisé' });
        }
        
        // Hasher mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer utilisateur
        const user = new User({
            nom, prenom, email, password: hashedPassword, role: 'prestataire'
        });
        await user.save();
        
        // Session
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.nom = user.nom;
        req.session.prenom = user.prenom;
        
        res.json({ success: true, message: 'Inscription réussie!', redirect: '/dashboard' });
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.json({ success: false, message: 'Erreur inscription' });
    }
});

// API - Connexion
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Chercher utilisateur
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'Email incorrect' });
        }
        
        // Vérifier mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.json({ success: false, message: 'Mot de passe incorrect' });
        }
        
        // Session
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.nom = user.nom;
        req.session.prenom = user.prenom;
        
        res.json({ success: true, message: 'Connexion réussie!', redirect: '/dashboard' });
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.json({ success: false, message: 'Erreur connexion' });
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
            message: 'Service créé avec succès!',
            redirect: '/dashboard'
        });
        
    } catch (error) {
        console.error('Erreur création service:', error);
        res.json({ success: false, message: 'Erreur création' });
    }
});

// ========== ROUTE TEST ==========
app.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Serveur ServiceN fonctionnel',
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// ========== ROUTE 404 ==========
app.get('*', (req, res) => {
    res.status(404).send(`
        <h1>404 - Page non trouvée</h1>
        <p>La page ${req.url} n'existe pas.</p>
        <a href="/">Retour à l'accueil</a>
    `);
});

// ========== DÉMARRAGE ==========
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
==========================================
🎉 SERVICE N PLATFORM - RENDER READY
==========================================
✅ Serveur démarré sur le port ${PORT}
🌐 Environnement: ${process.env.NODE_ENV || 'development'}
🔗 URL Render: https://servicesn-platform.onrender.com
🔗 Dashboard local: http://192.168.1.128:3333
==========================================
📋 Routes disponibles:
   • GET  /               - Page d'accueil
   • GET  /register       - Inscription
   • GET  /login          - Connexion
   • GET  /create-service - Création service
   • GET  /dashboard      - Tableau de bord
   • GET  /test           - Test API
   • POST /api/auth/*     - API auth
   • POST /api/services/* - API services
==========================================
    `);
});
