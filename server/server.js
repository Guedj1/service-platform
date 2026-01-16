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

console.log('🚀 ServiceN Platform - Version Finale');

// ========== CONFIGURATION ==========

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

// Servir fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Configuration Render
app.set('trust proxy', 1);

// Session
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'servicen-final-secret',
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

// ========== MODÈLE MESSAGE ==========
const messageSchema = new mongoose.Schema({
    expediteurId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    destinataireId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sujet: { type: String, default: "" },
    contenu: { type: String, required: true },
    lu: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    conversationId: { type: String, required: true }
});

const Message = mongoose.model("Message", messageSchema);

// Fonction pour générer un conversationId
const generateConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join("_");
};
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

// Fonction pour générer le HTML de base
const renderTemplate = (title, content, req) => {
    const isLoggedIn = !!req.session.userId;
    const userEmail = req.session.email || '';
    
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
            <p>© 2024 ServiceN Platform - Version Professionnelle</p>
            <p>Port: ${PORT} | Env: ${process.env.NODE_ENV || 'development'}</p>
        </div>
    </footer>
    
    <script src="/js/main.js"></script>
</body>
</html>`;
};

// ========== ROUTES UNIQUES ==========

// 1. ACCUEIL
app.get('/', (req, res) => {
    const isLoggedIn = !!req.session.userId;
    
    const content = `
        <section class="hero">
            <div class="container">
                <h1>ServiceN Platform <span class="highlight">Pro</span></h1>
                <p class="hero-subtitle">La plateforme professionnelle pour prestataires de services</p>
                
                <div class="cta-buttons">
                    ${isLoggedIn ? 
                        `<a href="/create-service" class="btn btn-primary btn-large">
                            <i class="fas fa-plus"></i> Créer un service
                        </a>
                        <a href="/dashboard" class="btn btn-secondary">
                            <i class="fas fa-chart-line"></i> Mon dashboard
                        </a>` 
                        : 
                        `<a href="/register" class="btn btn-primary btn-large">
                            <i class="fas fa-rocket"></i> Commencer gratuitement
                        </a>
                        <a href="/login" class="btn btn-secondary">
                            <i class="fas fa-sign-in-alt"></i> Se connecter
                        </a>`
                    }
                </div>
                
                ${isLoggedIn ? 
                    `<div class="user-status">
                        <p><i class="fas fa-user-check"></i> Connecté en tant que: ${req.session.email}</p>
                    </div>` 
                    : ''
                }
            </div>
        </section>
        
        <section class="features-section">
            <div class="container">
                <h2 class="section-title">Pourquoi ServiceN ?</h2>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <h3>Création Rapide</h3>
                        <p>Créez vos services en quelques minutes avec notre interface intuitive</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h3>Analytics Avancés</h3>
                        <p>Suivez vos performances avec des tableaux de bord détaillés</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h3>Sécurité Maximale</h3>
                        <p>Vos données sont cryptées et protégées</p>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    res.send(renderTemplate('Accueil', content, req));
});

// 2. INSCRIPTION (UNE SEULE ROUTE)
app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    
    const content = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">
                    <i class="fas fa-user-plus"></i> Créer votre compte
                </h1>
                
                <form id="registerForm" class="auth-form" method="POST" action="/api/auth/register">
                    <div class="form-group">
                        <label class="form-label">Nom complet *</label>
                        <div class="name-fields">
                            <input type="text" name="nom" class="form-control" placeholder="Nom" required>
                            <input type="text" name="prenom" class="form-control" placeholder="Prénom" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" name="email" class="form-control" placeholder="votre@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Mot de passe *</label>
                        <input type="password" name="password" class="form-control" placeholder="••••••••" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Confirmer le mot de passe *</label>
                        <input type="password" name="confirmPassword" class="form-control" placeholder="••••••••" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-check"></i> Créer mon compte
                    </button>
                </form>
                
                <div class="auth-links">
                    <p>Déjà un compte ? <a href="/login">Se connecter</a></p>
                    <p><a href="/"><i class="fas fa-arrow-left"></i> Retour à l'accueil</a></p>
                </div>
            </div>
        </div>
    `;
    
    res.send(renderTemplate('Inscription', content, req));
});

// 3. CONNEXION (UNE SEULE ROUTE)
app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    
    const content = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">
                    <i class="fas fa-sign-in-alt"></i> Connexion
                </h1>
                
                <form id="loginForm" class="auth-form" method="POST" action="/api/auth/login">
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" name="email" class="form-control" placeholder="votre@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Mot de passe *</label>
                        <input type="password" name="password" class="form-control" placeholder="••••••••" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-sign-in-alt"></i> Se connecter
                    </button>
                </form>
                
                <div class="auth-links">
                    <p>Pas de compte ? <a href="/register">S'inscrire maintenant</a></p>
                    <p><a href="/"><i class="fas fa-arrow-left"></i> Retour à l'accueil</a></p>
                </div>
            </div>
        </div>
    `;
    
    res.send(renderTemplate('Connexion', content, req));
});

// 4. CREATE-SERVICE (UNE SEULE ROUTE)
app.get('/create-service', requireAuth, (req, res) => {
    const content = `
        <div class="form-page-container">
            <div class="form-page-card">
                <h1 class="page-title">
                    <i class="fas fa-plus-circle"></i> Créer un nouveau service
                </h1>
                <p class="page-subtitle">Remplissez les détails de votre service pour commencer à attirer des clients</p>
                
                <form id="createServiceForm" class="service-form" method="POST" action="/api/services/create">
                    <div class="form-group">
                        <label class="form-label">Titre du service *</label>
                        <input type="text" name="title" class="form-control" 
                               placeholder="Ex: Développement d'application mobile React Native" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Description détaillée *</label>
                        <textarea name="description" class="form-control" rows="5" 
                                  placeholder="Décrivez votre service en détail..." required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Prix (FCFA) *</label>
                        <div class="price-input">
                            <input type="number" name="price" class="form-control" 
                                   placeholder="50000" min="1000" step="1000" required>
                            <span class="currency">FCFA</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Catégorie</label>
                        <select name="category" class="form-control">
                            <option value="">-- Sélectionnez --</option>
                            <option value="informatique">💻 Informatique</option>
                            <option value="design">🎨 Design</option>
                            <option value="marketing">📈 Marketing</option>
                            <option value="consulting">💼 Consulting</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block btn-large">
                        <i class="fas fa-paper-plane"></i> Publier le service
                    </button>
                </form>
                
                <div class="form-links">
                    <a href="/dashboard" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Retour au dashboard
                    </a>
                </div>
            </div>
        </div>
    `;
    
    res.send(renderTemplate('Créer Service', content, req));
});

// 5. DASHBOARD (UNE SEULE ROUTE)
app.get('/dashboard', requireAuth, async (req, res) => {
    let servicesCount = 0;
    let totalRevenue = 0;
    
    try {
        servicesCount = await Service.countDocuments({ userId: req.session.userId });
        const services = await Service.find({ userId: req.session.userId });
        totalRevenue = services.reduce((sum, service) => sum + (service.prix || 0), 0);
    } catch (error) {
        console.error('Erreur stats:', error);
    }
    
    const content = `
        <div class="dashboard-container">
            <div class="container">
                <div class="dashboard-header">
                    <h1><i class="fas fa-chart-line"></i> Tableau de bord</h1>
                    <p class="welcome-message">Bienvenue, <strong>${req.session.prenom || 'Cher prestataire'}</strong></p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Services actifs</h3>
                            <div class="stat-number">${servicesCount}</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Revenus totaux</h3>
                            <div class="stat-number">${totalRevenue.toLocaleString()} FCFA</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Clients</h3>
                            <div class="stat-number">0</div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-actions">
                    <h2><i class="fas fa-rocket"></i> Actions rapides</h2>
                    <div class="actions-grid">
                        <a href="/create-service" class="action-card">
                            <div class="action-icon">
                                <i class="fas fa-plus"></i>
                            </div>
                            <h3>Créer un service</h3>
                            <p>Publiez un nouveau service</p>
                        </a>
                        
                        <a href="/mes-services" class="action-card">
                            <div class="action-icon">
                                <i class="fas fa-list"></i>
                            </div>
                            <h3>Mes services</h3>
                            <p>Gérez vos services existants</p>
                        </a>
                        
                        <a href="/profile" class="action-card">
                            <div class="action-icon">
                                <i class="fas fa-user-edit"></i>
                            </div>
                            <h3>Mon profil</h3>
                            <p>Modifiez vos informations</p>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    res.send(renderTemplate('Dashboard', content, req));
});

// 6. DÉCONNEXION
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


// ========== MESSAGERIE ==========
const messagerieRoutes = require("./routes/messagerie");
app.use("/messagerie", messagerieRoutes);
// ========== API ROUTES ==========

// Inscription API
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, prenom, email, password, confirmPassword } = req.body;
        
        // Validation
        if (password !== confirmPassword) {
            return res.json({ success: false, message: 'Les mots de passe ne correspondent pas' });
        }
        
        if (password.length < 6) {
            return res.json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
        }
        
        // Vérifier email unique
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'Cet email est déjà utilisé' });
        }
        
        // Créer utilisateur
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            nom,
            prenom,
            email,
            password: hashedPassword,
            role: 'prestataire'
        });
        
        await user.save();
        
        // Session
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.nom = user.nom;
        req.session.prenom = user.prenom;
        req.session.role = user.role;
        
        res.json({ 
            success: true, 
            message: 'Compte créé avec succès !',
            redirect: '/dashboard'
        });
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.json({ success: false, message: 'Erreur lors de l\'inscription' });
    }
});

// Connexion API
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Chercher utilisateur
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
        
        // Vérifier mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
        
        // Session
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

// Créer service API
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
            message: 'Service créé avec succès !',
            redirect: '/dashboard'
        });
        
    } catch (error) {
        console.error('Erreur création service:', error);
        res.json({ success: false, message: 'Erreur lors de la création du service' });
    }
});

// ========== ROUTE TEST ==========
app.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        service: 'ServiceN Platform',
        version: '2.0',
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        time: new Date().toISOString()
    });
});

// ========== 404 ==========
app.get('*', (req, res) => {
    res.status(404).send(renderTemplate('404', `
        <div class="error-container">
            <h1>404 - Page non trouvée</h1>
            <p>La page que vous recherchez n'existe pas.</p>
            <a href="/" class="btn btn-primary">Retour à l'accueil</a>
        </div>
    `, req));
});

// ========== DÉMARRAGE ==========
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
==========================================
🎉 SERVICE N PLATFORM - VERSION FINALE
==========================================
✅ Serveur démarré sur le port ${PORT}
🌐 Environnement: ${process.env.NODE_ENV || 'development'}
🔗 URL: https://servicesn-platform.onrender.com
📁 Fichiers statiques: /public
==========================================
    `);
});
// ========== MODÈLE MESSAGE ==========
const messageSchema = new mongoose.Schema({
    expediteurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destinataireId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sujet: { type: String, default: '' },
    contenu: { type: String, required: true },
    lu: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    conversationId: { type: String, required: true } // ID unique pour regrouper les messages
});

const Message = mongoose.model('Message', messageSchema);

// Fonction pour générer un conversationId
const generateConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
};

// ========== MESSAGERIE SIMPLE ==========
app.get("/messagerie", requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Messagerie - ServiceN</title>
            <style>
                body { font-family: Arial; padding: 40px; background: #f0f2f5; }
                .messagerie-container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
                h1 { color: #333; }
                .feature-card { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 4px solid #4CAF50; }
                .btn { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="messagerie-container">
                <h1>📨 Messagerie ServiceN</h1>
                <p><strong>Connecté en tant que:</strong> ${req.session.email}</p>
                
                <div class="feature-card">
                    <h3>🚧 Fonctionnalité en développement</h3>
                    <p>Le système de messagerie complet est en cours de développement.</p>
                    <p><strong>Prochainement disponible:</strong></p>
                    <ul>
                        <li>Messages en temps réel entre prestataires</li>
                        <li>Notifications de nouveaux messages</li>
                        <li>Historique des conversations</li>
                        <li>Recherche dans les messages</li>
                    </ul>
                </div>
                
                <div style="margin-top: 30px;">
                    <p><strong>Pour communiquer maintenant:</strong></p>
                    <p>Utilisez les coordonnées fournies dans les fiches de service ou contactez l'administrateur.</p>
                </div>
                
                <div style="margin-top: 30px;">
                    <a href="/dashboard" class="btn">← Retour au dashboard</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Route API pour la messagerie (placeholder)
app.post("/api/messagerie/envoyer", requireAuth, (req, res) => {
    res.json({ 
        success: true, 
        message: "Système de messagerie en développement. Fonctionnalité bientôt disponible." 
    });
});
