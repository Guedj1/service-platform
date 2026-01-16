require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ MongoDB erreur:', err));

// CORS pour Render
app.use(cors({
  origin: [
    'https://servicesn-platform.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client'), { index: 'index.html' }));

// Proxy trust pour Render
app.set('trust proxy', 1);

// Sessions
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: {}
};

if (process.env.NODE_ENV === 'production') {
  sessionConfig.cookie = {
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 14,
    sameSite: 'none'
  };
} else {
  sessionConfig.cookie = {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 14,
    sameSite: 'lax'
  };
}

app.use(session(sessionConfig));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Session ID:', req.sessionID);
  console.log('User ID in session:', req.session.userId || 'Non authentifié');
  console.log('Cookie:', req.headers.cookie ? 'Présent' : 'Absent');
  next();
});

// Import des routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const serviceRoutes = require('./routes/services');



// ========== PAGE D'ACCUEIL RENDER ==========
            <title>ServiceN Platform</title>
// Route racine unique
app.get('/', (req, res) => {
    res.redirect('/create-service?v=4');
});
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                .container {
                    background: rgba(255, 255, 255, 0.95);
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 800px;
                }
                h1 { color: #333; margin-bottom: 20px; }
                .btn {
                    display: inline-block;
                    padding: 15px 30px;
                    margin: 10px;
                    background: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: bold;
                }
                .btn:hover { background: #764ba2; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 ServiceN Platform</h1>
                <p>Plateforme de services professionnels</p>
                
                <div style="margin: 30px 0;">
                    <a href="/create-service?v=4" class="btn">
                        📝 Créer un service
                    </a>
                    <a href="/login" class="btn">
                        🔐 Se connecter
                    </a>
                    <a href="/dashboard" class="btn">
                        📊 Tableau de bord
                    </a>
                </div>
                
                <div style="margin-top: 30px; color: #666;">
                    <p>Version: 4.0 | Port: 3003</p>
                    <p>Dashboard local: <a href="http://192.168.1.128:3333">192.168.1.128:3333</a></p>
                </div>
            </div>
        </body>
        </html>
    `);
});
// ============================================

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);

// ===== ROUTES PAGES HTML =====

// Page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.get('/login', (req, res) => {
});

app.get('/services.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'services.html'));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    console.log('❌ Accès dashboard refusé: non authentifié');
    return res.redirect('/login');
  }
  console.log('✅ Accès dashboard autorisé pour:', req.session.userId);
  res.sendFile(path.join(__dirname, '../client', 'dashboard.html'));
});

app.get('/create-service', (req, res) => {
    res.send('<h1>Formulaire Service</h1><form><input><button>Créer</button></form>');
});
  if (req.session.user?.role !== 'prestataire') {
    console.log('❌ Accès create-service refusé: non prestataire');
    return res.redirect('/dashboard');
  }
  console.log('✅ Accès create-service autorisé pour:', req.session.userId);
  res.sendFile(path.join(__dirname, '../client', 'create-service.html'));
});

app.get('/mes-services.html', (req, res) => {
  if (!req.session.userId) {
    console.log('❌ Accès mes-services refusé: non authentifié');
    return res.redirect('/login');
  }
  if (req.session.user?.role !== 'prestataire') {
    console.log('❌ Accès mes-services refusé: non prestataire');
    return res.redirect('/dashboard');
  }
  console.log('✅ Accès mes-services autorisé pour:', req.session.userId);
  res.sendFile(path.join(__dirname, '../client', 'mes-services.html'));
});

// Redirections contact
app.get('/contact/whatsapp', (req, res) => {
  res.redirect('https://wa.me/221761642285?text=Bonjour%20ServiceN%20Platform');
});

app.get('/contact/email', (req, res) => {
  res.redirect('mailto:louis.cicariot.tek.workspace@gmail.com?subject=ServiceN%20Platform');
});

// Page 404 - DOIT ÊTRE LA DERNIÈRE ROUTE
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../client', '404.html'));
});

// Démarrer
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🔒 Secure cookies: ${process.env.NODE_ENV === 'production' ? 'OUI' : 'NON'}`);
  console.log(`🍪 SameSite: ${process.env.NODE_ENV === 'production' ? 'none' : 'lax'}`);
  console.log(`🔧 Trust proxy: ${process.env.NODE_ENV === 'production' ? 'Activé' : 'Désactivé'}`);
});
app.get('/', (req, res) => { res.redirect('/create-service?v=4'); });
