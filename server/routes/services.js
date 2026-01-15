const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { body, validationResult } = require('express-validator');

// ===== MIDDLEWARE =====
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Authentification requise' });
  }
  next();
};

const requirePrestataire = (req, res, next) => {
  if (req.session.user?.role !== 'prestataire') {
    return res.status(403).json({ success: false, message: 'Réservé aux prestataires' });
  }
  next();
};

// ===== ROUTES PUBLIQUES =====

// Lister tous les services disponibles
router.get('/', async (req, res) => {
  try {
    const { categorie, localisation, minPrix, maxPrix, search } = req.query;
    
    let filter = { disponible: true };
    
    if (categorie) filter.categorie = categorie;
    if (localisation) filter.localisation = new RegExp(localisation, 'i');
    if (minPrix || maxPrix) {
      filter.prix = {};
      if (minPrix) filter.prix.$gte = Number(minPrix);
      if (maxPrix) filter.prix.$lte = Number(maxPrix);
    }
    if (search) {
      filter.$or = [
        { titre: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    
    const services = await Service.find(filter)
      .populate('prestataire', 'nom prenom email telephone')
      .sort({ dateCreation: -1 });
    
    res.json({ success: true, services });
    
  } catch (error) {
    console.error('Erreur liste services:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Voir un service spécifique
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('prestataire', 'nom prenom email telephone dateInscription');
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    
    res.json({ success: true, service });
    
  } catch (error) {
    console.error('Erreur détail service:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===== ROUTES PRIVÉES (PRESTATAIRES) =====

// Créer un nouveau service
router.post('/', requireAuth, requirePrestataire, [
  body('titre').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('categorie').isIn(['Plomberie', 'Électricité', 'Menuiserie', 'Coiffure', 'Cours', 'Informatique', 'Nettoyage', 'Autre']),
  body('prix').isNumeric().withMessage('Le prix doit être un nombre'),
  body('localisation').optional().trim()
], async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const service = new Service({
      ...req.body,
      prestataire: req.session.userId
    });
    
    await service.save();
    
    res.status(201).json({
      success: true,
      message: 'Service créé avec succès',
      service
    });
    
  } catch (error) {
    console.error('Erreur création service:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Mettre à jour un service
router.put('/:id', requireAuth, requirePrestataire, async (req, res) => {
  try {
    // Vérifier que le service appartient au prestataire
    const service = await Service.findOne({
      _id: req.params.id,
      prestataire: req.session.userId
    });
    
    if (!service) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service non trouvé ou non autorisé' 
      });
    }
    
    // Mettre à jour
    Object.assign(service, req.body);
    await service.save();
    
    res.json({
      success: true,
      message: 'Service mis à jour avec succès',
      service
    });
    
  } catch (error) {
    console.error('Erreur mise à jour service:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Supprimer un service (soft delete)
router.delete('/:id', requireAuth, requirePrestataire, async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      {
        _id: req.params.id,
        prestataire: req.session.userId
      },
      { disponible: false },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service non trouvé ou non autorisé' 
      });
    }
    
    res.json({
      success: true,
      message: 'Service désactivé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression service:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===== ROUTES PRIVÉES (MES SERVICES) =====

// Mes services (pour le prestataire connecté)
router.get('/mes-services/liste', requireAuth, requirePrestataire, async (req, res) => {
  try {
    const services = await Service.find({ prestataire: req.session.userId })
      .sort({ dateCreation: -1 });
    
    res.json({ success: true, services });
    
  } catch (error) {
    console.error('Erreur mes services:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
