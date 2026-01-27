// models/Moto.js
const mongoose = require('mongoose');

const motoSchema = new mongoose.Schema({
  marque: {
    type: String,
    required: [true, 'Veuillez entrer la marque'],
    trim: true,
    maxlength: [50, 'La marque ne doit pas dépasser 50 caractères']
  },
  modele: {
    type: String,
    required: [true, 'Veuillez entrer le modèle'],
    trim: true,
    maxlength: [50, 'Le modèle ne doit pas dépasser 50 caractères']
  },
  annee: {
    type: Number,
    required: [true, 'Veuillez entrer l\'année'],
    min: [1900, 'L\'année doit être supérieure à 1900'],
    max: [new Date().getFullYear(), 'L\'année ne doit pas être dans le futur']
  },
  couleur: {
    type: String,
    required: [true, 'Veuillez entrer la couleur'],
    trim: true,
    maxlength: [30, 'La couleur ne doit pas dépasser 30 caractères']
  },
  motorisation: {
    type: String,
    required: [true, 'Veuillez entrer la motorisation'],
    enum: ['Essence', 'Diesel', 'Électrique', 'Hybride'],
    trim: true
  },
  cylindre: {
    type: Number,
    required: [true, 'Veuillez entrer la cylindrée (en cc)'],
    min: [0, 'La cylindrée doit être positive']
  },
  boiteVitesse: {
    type: String,
    required: [true, 'Veuillez entrer le type de boîte de vitesse'],
    enum: ['Manuelle', 'Automatique', 'CVT'],
    trim: true
  },
  typeTransmission: {
    type: String,
    required: [true, 'Veuillez entrer le type de transmission'],
    enum: ['Chaîne', 'Courroie', 'Arbre'],
    trim: true
  },
  typeMoto: {
    type: String,
    required: [true, 'Veuillez entrer le type de moto'],
    enum: ['Routière', 'Sportive', 'Cruiser', 'Touring', 'Naked', 'Enduro', 'Trail', 'Scooter', 'Maxi-scooter'],
    trim: true
  },
  kilometrage: {
    type: Number,
    required: false, // Changed from true
    min: [0, 'Le kilométrage doit être positif']
  },
  etat: {
    type: String,
    enum: ['neuf', 'occasion'],
    required: [true, 'Veuillez préciser l\'état'],
    default: 'occasion'
  },
  typePermis: {
    type: String,
    required: [true, 'Veuillez entrer le type de permis requis'],
    enum: ['A1', 'A'],          // ← Modification importante ici !
    trim: true
  },
  immatriculation: {
    type: String,
    required: [true, 'Veuillez entrer l\'immatriculation'],
    unique: true,
    trim: true,
    uppercase: true
  },
  images: [{
    url: String,
    nomFichier: String
  }],
  agence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agence',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Moto', motoSchema);