const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, password, role = 'client' } = req.body;
    
    console.log('=== INSCRIPTION DEBUG ===');
    console.log('Données reçues:', { email, role });
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    }
    
    const user = new User({ nom, prenom, email, telephone, password, role });
    await user.save();
    
    console.log('Utilisateur créé:', { id: user._id, role: user.role });
    
    // Session
    req.session.userId = user._id;
    req.session.user = { 
      id: user._id, 
      email, 
      nom, 
      prenom, 
      telephone, 
      role: user.role  // IMPORTANT: prendre le role de la DB
    };
    
    console.log('Session créée:', req.session.user);
    
    res.json({ 
      success: true, 
      message: 'Inscription réussie!',
      user: req.session.user
    });
    
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== CONNEXION DEBUG ===');
    console.log('Email:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    console.log('Utilisateur trouvé:', { id: user._id, role: user.role });
    
    // Session
    req.session.userId = user._id;
    req.session.user = { 
      id: user._id, 
      email: user.email, 
      nom: user.nom, 
      prenom: user.prenom,
      telephone: user.telephone,
      role: user.role  // IMPORTANT: rôle de la DB
    };
    
    console.log('Session mise à jour:', req.session.user);
    
    res.json({ 
      success: true, 
      message: 'Connexion réussie!',
      user: req.session.user
    });
    
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Déconnexion
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Déconnecté' });
});

// Vérifier auth
router.get('/check', (req, res) => {
  console.log('=== CHECK AUTH DEBUG ===');
  console.log('Session ID:', req.sessionID);
  console.log('User in session:', req.session.user);
  res.json({ 
    isAuthenticated: !!req.session.userId,
    user: req.session.user 
  });
});

module.exports = router;
