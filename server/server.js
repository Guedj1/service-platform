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
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7
  };
} else {
  sessionConfig.cookie = {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7
  };
}

app.use(session(sessionConfig));

// Middleware pour ajouter des headers de sécurité
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ========== ROUTES SIMPLIFIÉES ==========

// Route racine
app.get('/', (req, res) => {
  res.redirect('/create-service?v=4');
});

// Route login simple
app.get('/login', (req, res) => {
  res.send('<h1>Connexion</h1><form><input placeholder="Email"><input type="password"><button>Se connecter</button></form>');
});

// Route création service (FORMULAIRE SIMPLE MAIS FONCTIONNEL)
app.get('/create-service', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Créer Service - ServiceN</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto; }
      h1 { color: #333; }
      .form-group { margin-bottom: 15px; }
      input, textarea { width: 100%; padding: 10px; margin-top: 5px; }
      button { background: #4CAF50; color: white; padding: 12px; border: none; width: 100%; }
    </style>
  </head>
  <body>
    <h1>📝 Créer un service</h1>
    <form>
      <div class="form-group">
        <label>Titre:</label>
        <input type="text" placeholder="Nom du service">
      </div>
      <div class="form-group">
        <label>Description:</label>
        <textarea rows="4" placeholder="Description détaillée"></textarea>
      </div>
      <div class="form-group">
        <label>Prix (FCFA):</label>
        <input type="number" placeholder="50000">
      </div>
      <button type="submit">Publier le service</button>
    </form>
    <p><a href="/">← Retour</a></p>
  </body>
  </html>
  `;
  res.send(html);
});

// Routes API (simulées pour l'instant)
app.post('/api/services', (req, res) => {
  res.json({ success: true, message: 'Service créé!' });
});

// Route fallback
app.get('*', (req, res) => {
  res.status(404).send('<h1>404 - Page non trouvée</h1><a href="/">Retour à l\'accueil</a>');
});

// Import des routes (si existantes)
try {
  const authRoutes = require('./routes/auth');
  const dashboardRoutes = require('./routes/dashboard');
  const serviceRoutes = require('./routes/services');
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/services', serviceRoutes);
  console.log('✅ Routes API chargées');
} catch (err) {
  console.log('ℹ️ Routes API non chargées (mode simplifié)');
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(\`✅ Serveur démarré sur le port \${PORT}\`);
  console.log(\`🌐 Environnement: \${process.env.NODE_ENV || 'development'}\`);
  console.log(\`🔗 URL: http://localhost:\${PORT}\`);
  console.log('🔒 Secure cookies: ' + (process.env.NODE_ENV === 'production' ? 'OUI' : 'NON'));
});
