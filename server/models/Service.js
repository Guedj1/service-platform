const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['Plomberie', 'Électricité', 'Menuiserie', 'Coiffure', 'Cours', 'Informatique', 'Nettoyage', 'Autre']
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  prestataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  localisation: {
    type: String,
    required: [true, 'La localisation est requise'],
    default: 'Dakar'
  },
  images: {
    type: [String],
    default: []
  },
  disponible: {
    type: Boolean,
    default: true
  },
  noteMoyenne: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  nombreAvis: {
    type: Number,
    default: 0
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  }
});

// Mettre à jour dateModification avant sauvegarde
ServiceSchema.pre('save', function(next) {
  this.dateModification = Date.now();
  next();
});

module.exports = mongoose.model('Service', ServiceSchema);
