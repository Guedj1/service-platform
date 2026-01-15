const express = require('express');
const router = express.Router();

// Route GET pour le dashboard
router.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }
  res.json({ 
    success: true, 
    message: 'Bienvenue sur le dashboard',
    user: req.session.user 
  });
});

// Route pour les statistiques
router.get('/stats', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }
  res.json({
    success: true,
    stats: {
      services: 0,
      clients: 0,
      revenue: 0,
      rating: 5.0
    }
  });
});

module.exports = router;
