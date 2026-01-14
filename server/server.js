require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const sessionConfig = require('./config/session');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

// Initialiser l'application
const app = express();

// Connexion à la base de données
connectDB();

// Middleware
app.use(cors({
  origin: [
    'https://servicesn-platform.onrender.com',
    'http://localhost:3000',
    'https://guedj1.github.io'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionConfig);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../client')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Routes pour les pages HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/register.html'));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, '../client/dashboard.html'));
});

// Route de santé pour Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ServiceN Platform API'
  });
});

// Redirection WhatsApp
app.get('/contact/whatsapp', (req, res) => {
  const phone = process.env.ADMIN_PHONE || '+221761642285';
  const message = encodeURIComponent('Bonjour, je souhaite des informations sur ServiceN Platform');
  res.redirect(`https://wa.me/${phone.replace('+', '')}?text=${message}`);
});

// Redirection Email
app.get('/contact/email', (req, res) => {
  const email = process.env.ADMIN_EMAIL || 'louis.cicariot.tek.workspace@gmail.com';
  res.redirect(`mailto:${email}?subject=Demande d'information ServiceN`);
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../client/404.html'));
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Une erreur est survenue',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});
