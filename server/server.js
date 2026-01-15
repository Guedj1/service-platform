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

// Middleware
app.use(cors({
  origin: ['https://servicesn-platform.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 14
  }
}));

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

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
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
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../client', '404.html'));
});

// Démarrer
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});
