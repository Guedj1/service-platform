require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/servicen')
    .then(() => console.log('✅ MongoDB'))
    .catch(err => console.log('⚠️  MongoDB:', err.message));

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

// Modèles
const User = mongoose.model('User', {
    email: String, password: String, nom: String, prenom: String, role: String
});
const Service = mongoose.model('Service', {
    titre: String, description: String, prix: Number, userId: String
});

// Middleware auth
const requireAuth = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    next();
};

// ========== ROUTES ==========

// 1. Accueil
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>ServiceN</title></head>
        <body>
            <h1>ServiceN Platform</h1>
            ${req.session.userId ? 
                `<p>Bienvenue ${req.session.email}</p>
                 <a href="/dashboard">Dashboard</a>` :
                `<a href="/login">Connexion</a>
                 <a href="/register">Inscription</a>`
            }
            <a href="/create-service">Créer service</a>
        </body>
        </html>
    `);
});

// 2. Inscription
app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.send(`
        <h1>Inscription</h1>
        <form id="registerForm">
            <input name="nom" placeholder="Nom" required>
            <input name="prenom" placeholder="Prénom" required>
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Mot de passe" required>
            <button type="submit">S'inscrire</button>
        </form>
        <script>
            document.getElementById('registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(formData))
                });
                const result = await response.json();
                if (result.success) {
                    alert('Inscription réussie!');
                    window.location.href = '/dashboard';
                } else {
                    alert('Erreur: ' + result.message);
                }
            });
        </script>
    `);
});

// 3. Connexion
app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.send(`
        <h1>Connexion</h1>
        <form id="loginForm">
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Mot de passe" required>
            <button type="submit">Se connecter</button>
        </form>
        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(formData))
                });
                const result = await response.json();
                if (result.success) {
                    window.location.href = '/dashboard';
                } else {
                    alert('Email ou mot de passe incorrect');
                }
            });
        </script>
    `);
});

// 4. Create-service (EXISTANT - À GARDER)
app.get('/create-service', requireAuth, (req, res) => {
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

// 5. Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    res.send(`
        <h1>Dashboard</h1>
        <p>Bienvenue ${req.session.email}</p>
        <a href="/create-service">Créer service</a>
        <a href="/logout">Déconnexion</a>
    `);
});

// 6. Déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ========== API ==========

// Inscription
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, prenom, email, password } = req.body;
        
        // Vérifier email existant
        const existing = await User.findOne({ email });
        if (existing) {
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
        req.session.role = user.role;
        
        res.json({ success: true, message: 'Inscription réussie' });
        
    } catch (error) {
        res.json({ success: false, message: 'Erreur inscription' });
    }
});

// Connexion
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'Email incorrect' });
        }
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.json({ success: false, message: 'Mot de passe incorrect' });
        }
        
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.nom = user.nom;
        req.session.prenom = user.prenom;
        req.session.role = user.role;
        
        res.json({ success: true, message: 'Connexion réussie' });
        
    } catch (error) {
        res.json({ success: false, message: 'Erreur connexion' });
    }
});

// Créer service
app.post('/api/services/create', requireAuth, async (req, res) => {
    try {
        const { title, description, price, category } = req.body;
        
        const service = new Service({
            titre: title,
            description,
            prix: price,
            userId: req.session.userId,
            categorie: category
        });
        await service.save();
        
        res.json({ 
            success: true, 
            message: 'Service créé avec succès!',
            serviceId: service._id
        });
        
    } catch (error) {
        res.json({ success: false, message: 'Erreur création' });
    }
});

// Démarrer
app.listen(PORT, () => {
    console.log('🚀 ServiceN Platform - Port: ' + PORT);
});
