const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Inscription
router.post('/register', [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('telephone').matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Numéro invalide'),
  body('password').isLength({ min: 6 }).withMessage('Minimum 6 caractères'),
  body('role').optional().isIn(['client', 'prestataire'])
], async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { nom, prenom, email, telephone, password, role = 'client' } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur
    const user = new User({
      nom,
      prenom,
      email,
      telephone,
      password,
      role
    });

    await user.save();

    // Créer la session
    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.user = {
      id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role
    };

    res.status(201).json({
      success: true,
      message: 'Inscription réussie!',
      user: req.session.user,
      redirect: '/dashboard'
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur. Veuillez réessayer.'
    });
  }
});

// Connexion
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administration.'
      });
    }

    // Créer la session
    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.user = {
      id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Connexion réussie!',
      user: req.session.user,
      redirect: '/dashboard'
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Déconnexion
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la déconnexion' 
      });
    }
    res.clearCookie('connect.sid');
    res.json({ 
      success: true, 
      message: 'Déconnexion réussie',
      redirect: '/' 
    });
  });
});

// Vérifier la session
router.get('/check-auth', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({
      isAuthenticated: true,
      user: req.session.user
    });
  }
  res.json({ isAuthenticated: false });
});

module.exports = router;
