const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, password, role = 'client' } = req.body;
    
    // Vérifier si l'utilisateur existe
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    }
    
    // Créer l'utilisateur
    const user = new User({ nom, prenom, email, telephone, password, role });
    await user.save();
    
    // Session
    req.session.userId = user._id;
    req.session.user = { 
      id: user._id, 
      email, nom, prenom, 
      telephone, role 
    };
    
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
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }
    
    // Session
    req.session.userId = user._id;
    req.session.user = { 
      id: user._id, 
      email: user.email, 
      nom: user.nom, 
      prenom: user.prenom,
      telephone: user.telephone,
      role: user.role 
    };
    
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
  if (req.session.userId) {
    res.json({ isAuthenticated: true, user: req.session.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

module.exports = router;
