require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ MongoDB erreur:', err));

// IMPORTANT: Configuration CORS pour Render
const corsOptions = {
  origin: [
    'https://servicesn-platform.onrender.com',
    'http://localhost:3000',
    'http://localhost:10000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Préflight requests

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

// Sessions - CONFIGURATION CRITIQUE POUR RENDER
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_for_dev',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60 // 14 jours
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // TRUE sur Render
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 jours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // IMPORTANT
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
  }
}));

// Debug middleware pour les sessions
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Session ID:', req.sessionID);
  console.log('User in session:', req.session.userId ? 'Authentifié' : 'Non authentifié');
  next();
});

// Import des routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const serviceRoutes = require('./routes/services');

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);

// Routes pages HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'register.html'));
});

app.get('/services.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'services.html'));
});

app.get('/dashboard', (req, res) => {
  // Vérification de session
  if (!req.session.userId) {
    console.log('❌ Accès dashboard refusé: non authentifié');
    return res.redirect('/login');
  }
  console.log('✅ Accès dashboard autorisé pour:', req.session.userId);
  res.sendFile(path.join(__dirname, '../client', 'dashboard.html'));
});

// Redirections contact
app.get('/contact/whatsapp', (req, res) => {
  res.redirect('https://wa.me/221761642285?text=Bonjour%20ServiceN%20Platform');
});

app.get('/contact/email', (req, res) => {
  res.redirect('mailto:louis.cicariot.tek.workspace@gmail.com?subject=ServiceN%20Platform');
});

// Page 404
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
});
