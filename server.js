require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ MongoDB erreur:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client')));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60 // 14 jours
  }),
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 14
  }
}));

// Modèle User simple
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  nom: String,
  prenom: String,
  telephone: String,
  role: { type: String, default: 'client' }
});
const User = mongoose.model('User', UserSchema);

// Routes API
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone, role } = req.body;
    
    // Vérifier si l'utilisateur existe
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    }
    
    // Créer l'utilisateur
    const user = new User({ email, password, nom, prenom, telephone, role });
    await user.save();
    
    // Créer la session
    req.session.userId = user._id;
    req.session.user = { id: user._id, email, nom, prenom, role };
    
    res.json({ 
      success: true, 
      message: 'Inscription réussie!',
      user: req.session.user,
      redirect: '/dashboard.html'
    });
    
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    // Créer la session
    req.session.userId = user._id;
    req.session.user = { 
      id: user._id, 
      email: user.email, 
      nom: user.nom, 
      prenom: user.prenom, 
      role: user.role 
    };
    
    res.json({ 
      success: true, 
      message: 'Connexion réussie!',
      user: req.session.user,
      redirect: '/dashboard.html'
    });
    
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Déconnecté', redirect: '/' });
});

app.get('/api/check-auth', (req, res) => {
  if (req.session.userId) {
    res.json({ isAuthenticated: true, user: req.session.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Routes pages HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'client', 'dashboard.html'));
});

// Redirections contact
app.get('/contact/whatsapp', (req, res) => {
  res.redirect('https://wa.me/221761642285?text=Bonjour%20ServiceN%20Platform');
});

app.get('/contact/email', (req, res) => {
  res.redirect('mailto:louis.cicariot.tek.workspace@gmail.com?subject=ServiceN%20Platform');
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📧 Email: /contact/email`);
  console.log(`📱 WhatsApp: /contact/whatsapp`);
});
