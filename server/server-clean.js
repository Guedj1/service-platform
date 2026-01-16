require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 ServiceN Platform - Démarrage...');

// MongoDB
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('✅ MongoDB connecté'))
        .catch(err => console.log('⚠️ MongoDB erreur:', err.message));
}

// Middleware
app.use(cors({
    origin: [
        'https://servicesn-platform.onrender.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://192.168.1.128:3333'
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'servicen-secret-123',
    resave: false,
    saveUninitialized: false,
    store: process.env.MONGODB_URI ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI }) : null,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// ========== ROUTES ==========

// Route racine SIMPLE
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ServiceN Platform</title>
            <style>
                body { font-family: Arial; padding: 40px; text-align: center; }
                h1 { color: #333; }
                .btn { display: inline-block; padding: 15px 30px; margin: 10px; 
                       background: #4CAF50; color: white; text-decoration: none; 
                       border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>🚀 ServiceN Platform</h1>
            <p>Plateforme de services professionnels</p>
            <div>
                <a href="/create-service" class="btn">Créer un service</a>
                <a href="/login" class="btn">Se connecter</a>
                <a href="/dashboard" class="btn">Tableau de bord</a>
            </div>
        </body>
        </html>
    `);
});

// Login SIMPLE
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Login</title></head>
        <body>
            <h1>Connexion</h1>
            <form action="/api/auth/login" method="POST">
                <input type="email" name="email" placeholder="Email" required>
                <input type="password" name="password" placeholder="Mot de passe" required>
                <button type="submit">Se connecter</button>
            </form>
        </body>
        </html>
    `);
});

// Create-service SIMPLE mais COMPLET
app.get('/create-service', (req, res) => {
    // Vérifier session
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Créer Service</title>
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
            <p><a href="/dashboard">← Retour</a></p>
        </body>
        </html>
    `);
});

// Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.send(`
        <h1>Tableau de bord</h1>
        <p>Bienvenue utilisateur!</p>
        <a href="/create-service">Créer service</a>
    `);
});

// API Routes
app.post('/api/auth/login', (req, res) => {
    req.session.userId = 'user_' + Date.now();
    req.session.email = req.body.email || 'test@example.com';
    res.json({ success: true, redirect: '/dashboard' });
});

app.post('/api/services/create', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    res.json({ 
        success: true, 
        message: 'Service créé avec succès!',
        serviceId: 'SVC_' + Date.now()
    });
});

// Fallback
app.get('*', (req, res) => {
    res.status(404).send('<h1>404</h1><a href="/">Accueil</a>');
});

// Démarrer
app.listen(PORT, () => {
    console.log(\`✅ Serveur sur le port \${PORT}\`);
});
