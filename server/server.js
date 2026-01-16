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

console.log('🚀 ServiceN Platform - Version Pro');

// MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicen';
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.log('⚠️  MongoDB:', err.message));

// Middleware
app.use(cors({
    origin: ['https://servicesn-platform.onrender.com', 'http://localhost:3000', 'http://192.168.1.128:3333'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'servicen-pro-secret-2024',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGODB_URI }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// ========== MODÈLES ==========
const User = mongoose.model('User', {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    telephone: String,
    role: { type: String, default: 'prestataire' },
    createdAt: { type: Date, default: Date.now }
});

const Service = mongoose.model('Service', {
    titre: { type: String, required: true },
    description: { type: String, required: true },
    prix: { type: Number, required: true },
    categorie: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

// ========== HELPERS ==========
const requireAuth = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    next();
};

// Fonction helper pour générer le HTML de base
const baseHTML = (title, content, req) => {
    const isLoggedIn = !!req.session.userId;
    
    return `<!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - ServiceN Platform</title>
        <link rel="stylesheet" href="/css/style.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body>
        <nav class="navbar">
            <div class="container">
                <a href="/" class="logo">
                    <span class="logo-icon">🚀</span>
                    ServiceN Platform
                </a>
                <div class="nav-links">
                    ${isLoggedIn ? 
                        `<a href="/dashboard" class="nav-link">
                            <i class="fas fa-chart-line"></i> Dashboard
                        </a>
                        <a href="/create-service" class="nav-link">
                            <i class="fas fa-plus-circle"></i> Créer service
                        </a>
                        <a href="/logout" class="btn btn-primary">
                            <i class="fas fa-sign-out-alt"></i> Déconnexion
                        </a>` 
                        : 
                        `<a href="/login" class="nav-link">
                            <i class="fas fa-sign-in-alt"></i> Connexion
                        </a>
                        <a href="/register" class="btn btn-primary">
                            <i class="fas fa-user-plus"></i> S'inscrire
                        </a>`
                    }
                </div>
            </div>
        </nav>
        
        ${content}
        
        <footer class="footer">
            <div class="container">
                <p>© 2024 ServiceN Platform - Plateforme professionnelle</p>
                <p>Dashboard local: <a href="http://192.168.1.128:3333" style="color: #93c5fd;">192.168.1.128:3333</a></p>
            </div>
        </footer>
        
        <script src="/js/main.js"></script>
    </body>
    </html>`;
};

// ========== ROUTES ==========

// 1. ACCUEIL
app.get('/', (req, res) => {
    const isLoggedIn = !!req.session.userId;
    
    const content = `
        <section class="hero">
            <div class="container">
                <h1>ServiceN Platform <span style="color: #f59e0b;">Pro</span></h1>
                <p>La plateforme professionnelle pour créer, gérer et vendre vos services en ligne</p>
                
                <div style="margin-top: 3rem;">
                    ${isLoggedIn ? 
                        `<a href="/create-service" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Créer un service
                        </a>` 
                        : 
                        `<a href="/register" class="btn btn-primary">
                            <i class="fas fa-rocket"></i> Commencer gratuitement
                        </a>`
                    }
                </div>
            </div>
        </section>
        
        <section class="features">
            <div class="container">
                <h2 style="text-align: center; font-size: 2.5rem;">Fonctionnalités Professionnelles</h2>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">💼</div>
                        <h3>Création Pro</h3>
                        <p>Interface moderne pour créer vos services</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">💰</div>
                        <h3>Gestion Financière</h3>
                        <p>Suivez vos revenus et factures</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3>Dashboard Avancé</h3>
                        <p>Statistiques détaillées de votre activité</p>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    res.send(baseHTML('Accueil', content, req));
});

// 2. INSCRIPTION
app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    
    const content = `
        <div class="form-container">
            <h1 class="form-title">Inscription Professionnelle</h1>
            
            <form id="registerForm" action="/api/auth/register" method="POST">
                <div class="form-group">
                    <label class="form-label">Nom & Prénom</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <input type="text" name="nom" class="form-control" placeholder="Nom" required>
                        <input type="text" name="prenom" class="form-control" placeholder="Prénom" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-control" placeholder="votre@entreprise.com" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Mot de passe</label>
                    <input type="password" name="password" class="form-control" placeholder="••••••••" required>
                </div>
                
                <button type="submit" class="btn btn-primary">
                    Créer mon compte pro
                </button>
            </form>
            
            <div style="text-align: center; margin-top: 2rem;">
                <p>Déjà un compte ? <a href="/login">Se connecter</a></p>
            </div>
        </div>
    `;
    
    res.send(baseHTML('Inscription', content, req));
});

// 3. CONNEXION
app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    
    const content = `
        <div class="form-container">
            <h1 class="form-title">Connexion Professionnelle</h1>
            
            <form id="loginForm" action="/api/auth/login" method="POST">
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-control" placeholder="votre@email.com" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Mot de passe</label>
                    <input type="password" name="password" class="form-control" placeholder="••••••••" required>
                </div>
                
                <button type="submit" class="btn btn-primary">
                    Se connecter
                </button>
            </form>
            
            <div style="text-align: center; margin-top: 2rem;">
                <p>Pas de compte ? <a href="/register">S'inscrire</a></p>
            </div>
        </div>
    `;
    
    res.send(baseHTML('Connexion', content, req));
});

// 4. CREATE-SERVICE (Conserver l'existant amélioré)
app.get('/create-service', requireAuth, (req, res) => {
    const content = `
        <div class="form-container">
            <h1 class="form-title">Créer un Service Professionnel</h1>
            
            <form action="/api/services/create" method="POST">
                <div class="form-group">
                    <label class="form-label">Titre du service *</label>
                    <input type="text" name="title" class="form-control" placeholder="Ex: Développement web React" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea name="description" class="form-control" rows="5" required></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Prix (FCFA) *</label>
                    <input type="number" name="price" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Catégorie</label>
                    <select name="category" class="form-control">
                        <option value="informatique">Informatique</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                    </select>
                </div>
                
                <button type="submit" class="btn btn-primary">
                    Publier le service
                </button>
            </form>
        </div>
    `;
    
    res.send(baseHTML('Créer Service', content, req));
});

// 5. DASHBOARD
app.get('/dashboard', requireAuth, async (req, res) => {
    let servicesCount = 0;
    
    try {
        servicesCount = await Service.countDocuments({ userId: req.session.userId });
    } catch (error) {
        console.error('Erreur stats:', error);
    }
    
    const content = `
        <div class="dashboard">
            <div class="container">
                <h1>Tableau de Bord Professionnel</h1>
                <p>Bienvenue ${req.session.prenom || ''}</p>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Services Actifs</h3>
                        <div class="stat-number">${servicesCount}</div>
                    </div>
                    
                    <div class="stat-card">
                        <h3>Revenus</h3>
                        <div class="stat-number">0 FCFA</div>
                    </div>
                </div>
                
                <div style="margin-top: 3rem;">
                    <a href="/create-service" class="btn btn-primary">
                        Créer un nouveau service
                    </a>
                </div>
            </div>
        </div>
    `;
    
    res.send(baseHTML('Dashboard', content, req));
});

// 6. DÉCONNEXION
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ========== API ROUTES ==========

// Inscription
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, prenom, email, password } = req.body;
        
        // Vérifier email
        const existing = await User.findOne({ email });
        if (existing) {
            return res.json({ success: false, message: 'Email déjà utilisé' });
        }
        
        // Créer utilisateur
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            nom, prenom, email, password: hashedPassword, role: 'prestataire'
        });
        await user.save();
        
        // Session
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.nom = user.nom;
        req.session.prenom = user.prenom;
        
        res.json({ success: true, message: 'Compte créé!', redirect: '/dashboard' });
        
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
        
        res.json({ success: true, message: 'Connecté!', redirect: '/dashboard' });
        
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
        res.json({ success: false, message: 'Erreur création' });
    }
});

// Démarrer
app.listen(PORT, () => {
    console.log(`🎉 ServiceN Platform Pro - Port: ${PORT}`);
    console.log(`🔗 https://servicesn-platform.onrender.com`);
});
