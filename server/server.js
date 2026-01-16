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

console.log('🚀 ServiceN Platform - Version Stable');

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

// Configuration Render
app.set('trust proxy', 1);

// Session
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'servicen-secret-stable',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGODB_URI }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

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

// ========== FONCTION TEMPLATE ==========
const renderTemplate = (title, content, req) => {
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
    
    <main class="main-content">
        ${content}
    </main>
    
    <footer class="footer">
        <div class="container">
            <p>© 2024 ServiceN Platform - Version Stable</p>
        </div>
    </footer>
    
    <script src="/js/main.js"></script>
</body>
</html>`;
};

// ========== ROUTES PRINCIPALES ==========

// 1. ACCUEIL
app.get('/', (req, res) => {
    const isLoggedIn = !!req.session.userId;
    
    const content = `
        <section class="hero">
            <div class="container">
                <h1>ServiceN Platform</h1>
                <p>Plateforme professionnelle de services</p>
                
                <div class="cta-buttons">
                    ${isLoggedIn ? 
                        `<a href="/create-service" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Créer un service
                        </a>
                        <a href="/dashboard" class="btn btn-secondary">
                            <i class="fas fa-chart-line"></i> Dashboard
                        </a>` 
                        : 
                        `<a href="/register" class="btn btn-primary">
                            <i class="fas fa-rocket"></i> Commencer
                        </a>
                        <a href="/login" class="btn btn-secondary">
                            <i class="fas fa-sign-in-alt"></i> Se connecter
                        </a>`
                    }
                </div>
            </div>
        </section>
    `;
    
    res.send(renderTemplate('Accueil', content, req));
});

// 2. INSCRIPTION
app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    
    const content = `
        <div class="form-container">
            <h1 class="form-title">Inscription</h1>
            
            <form action="/api/auth/register" method="POST">
                <div class="form-group">
                    <label class="form-label">Nom & Prénom</label>
                    <div class="name-fields">
                        <input type="text" name="nom" class="form-control" placeholder="Nom" required>
                        <input type="text" name="prenom" class="form-control" placeholder="Prénom" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-control" placeholder="email@example.com" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Mot de passe</label>
                    <input type="password" name="password" class="form-control" placeholder="••••••••" required>
                </div>
                
                <button type="submit" class="btn btn-primary">S'inscrire</button>
            </form>
            
            <div class="auth-links">
                <p>Déjà un compte ? <a href="/login">Se connecter</a></p>
            </div>
        </div>
    `;
    
    res.send(renderTemplate('Inscription', content, req));
});

// 3. CONNEXION
app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    
    const content = `
        <div class="form-container">
            <h1 class="form-title">Connexion</h1>
            
            <form action="/api/auth/login" method="POST">
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-control" placeholder="email@example.com" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Mot de passe</label>
                    <input type="password" name="password" class="form-control" placeholder="••••••••" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Se connecter</button>
            </form>
            
            <div class="auth-links">
                <p>Pas de compte ? <a href="/register">S'inscrire</a></p>
            </div>
        </div>
    `;
    
    res.send(renderTemplate('Connexion', content, req));
});

// 4. CREATE-SERVICE
app.get('/create-service', requireAuth, (req, res) => {
    const content = `
        <div class="form-container">
            <h1 class="form-title">Créer un service</h1>
            
            <form action="/api/services/create" method="POST">
                <div class="form-group">
                    <label class="form-label">Titre *</label>
                    <input type="text" name="title" class="form-control" placeholder="Titre du service" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description *</label>
                    <textarea name="description" class="form-control" rows="4" required></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Prix (FCFA) *</label>
                    <input type="number" name="price" class="form-control" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Publier</button>
            </form>
        </div>
    `;
    
    res.send(renderTemplate('Créer Service', content, req));
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
        <div class="dashboard-container">
            <div class="container">
                <h1>Tableau de bord</h1>
                <p>Bienvenue ${req.session.prenom || ''}</p>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Services actifs</h3>
                        <div class="stat-number">${servicesCount}</div>
                    </div>
                </div>
                
                <div class="dashboard-actions">
                    <a href="/create-service" class="btn btn-primary">Créer un service</a>
                </div>
            </div>
        </div>
    `;
    
    res.send(renderTemplate('Dashboard', content, req));
});

// 6. MESSAGERIE SIMPLE
app.get('/messagerie', requireAuth, (req, res) => {
    const content = `
        <div class="form-container">
            <h1 class="form-title">Messagerie</h1>
            <p class="subtitle">Fonctionnalité en développement</p>
            
            <div class="info-card">
                <h3><i class="fas fa-tools"></i> En cours de construction</h3>
                <p>Le système de messagerie complet sera disponible prochainement.</p>
                <p>Vous pourrez bientôt:</p>
                <ul>
                    <li>Envoyer des messages aux autres prestataires</li>
                    <li>Recevoir des notifications en temps réel</li>
                    <li>Consulter l'historique des conversations</li>
                </ul>
            </div>
            
            <div class="auth-links">
                <a href="/dashboard" class="btn btn-secondary">
                    <i class="fas fa-arrow-left"></i> Retour au dashboard
                </a>
            </div>
        </div>
    `;
    
    res.send(renderTemplate('Messagerie', content, req));
});

// 7. DÉCONNEXION
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ========== API ROUTES ==========

// Inscription
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, prenom, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'Email déjà utilisé' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            nom, prenom, email, password: hashedPassword, role: 'prestataire'
        });
        
        await user.save();
        
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
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
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
        const { title, description, price } = req.body;
        
        const service = new Service({
            titre: title,
            description,
            prix: price,
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

// API Messagerie placeholder
app.post('/api/messagerie/envoyer', requireAuth, (req, res) => {
    res.json({ 
        success: true, 
        message: 'Messagerie en développement. Fonctionnalité bientôt disponible.'
    });
});

// ========== TEST ==========
app.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        service: 'ServiceN Platform',
        version: 'stable',
        port: PORT,
        time: new Date().toISOString()
    });
});

// ========== 404 ==========
app.get('*', (req, res) => {
    res.status(404).send(renderTemplate('404', `
        <div class="error-container">
            <h1>404 - Page non trouvée</h1>
            <a href="/" class="btn btn-primary">Accueil</a>
        </div>
    `, req));
});

// ========== DÉMARRAGE ==========
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
==========================================
✅ ServiceN Platform - STABLE
==========================================
Port: ${PORT}
URL: https://servicesn-platform.onrender.com
==========================================
    `);
});
