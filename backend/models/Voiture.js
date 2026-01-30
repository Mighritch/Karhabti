// models/Voiture.js
const mongoose = require('mongoose');

const voitureSchema = new mongoose.Schema({
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
  categorie: {
    type: String,
    required: [true, 'Veuillez entrer la catégorie'],
    trim: true
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
  immatriculation: {
    type: String,
    required: [true, 'Veuillez entrer l\'immatriculation'],
    unique: true,
    trim: true,
    uppercase: true
  },
  kilometrage: {
    type: Number,
    required: false, // Changed from true to allow empty for 'neuf'
    min: [0, 'Le kilométrage doit être positif']
  },
  etat: {
    type: String,
    enum: ['neuf', 'occasion'],
    required: [true, 'Veuillez préciser l\'état du véhicule'],
    default: 'occasion'
  },
  motorisation: {
    type: String,
    required: [true, 'Veuillez entrer la motorisation'],
    enum: ['Essence', 'Diesel', 'Électrique', 'Hybride', 'Hybride rechargeable', 'GPL'],
    trim: true
  },
  puissance: {
    type: Number,
    required: [true, 'Veuillez entrer la puissance (en kW)'],
    min: [1, 'La puissance doit être au minimum 1 kW']
  },
  cylindre: {
    type: Number,
    required: [true, 'Veuillez entrer la cylindrée (en cc)'],
    min: [0, 'La cylindrée doit être positive']
  },
  boiteVitesse: {
    type: String,
    required: [true, 'Veuillez entrer le type de boîte de vitesse'],
    enum: ['Manuelle', 'Automatique', 'CVT', 'Semi-automatique'],
    trim: true
  },
  nbrVitesse: {
    type: Number,
    required: [true, 'Veuillez entrer le nombre de vitesses'],
    min: [1, 'Le nombre de vitesses doit être au minimum 1']
  },
  consommation: {
    type: Number,
    required: [true, 'Veuillez entrer la consommation (en L/100km)'],
    min: [0, 'La consommation doit être positive']
  },
  nbrPortes: {
    type: Number,
    required: [true, 'Veuillez entrer le nombre de portes'],
    enum: [2, 3, 4, 5],
    min: [2, 'Le nombre de portes doit être au minimum 2']
  },
  nbrPlaces: {
    type: Number,
    required: [true, 'Veuillez entrer le nombre de places'],
    min: [1, 'Le nombre de places doit être au minimum 1'],
    max: [9, 'Le nombre de places ne doit pas dépasser 9']
  },
  airbags: {
    type: Number,
    required: [true, 'Veuillez entrer le nombre d\'airbags'],
    min: [0, 'Le nombre d\'airbags doit être positif']
  },
  abs: {
    type: Boolean,
    default: true
  },
  regulateurVitesse: {
    type: Boolean,
    default: false
  },
  climatisation: {
    type: Boolean,
    default: false
  },
  cameraRecul: {
    type: Boolean,
    default: false
  },
  gps: {
    type: Boolean,
    default: false
  },
  ecranMultimedia: {
    type: Boolean,
    default: false
  },
  typePermis: {
    type: String,
    enum: ['B'],
    default: 'B',
    required: true
  },
 prix: {
    type: Number,
    required: [true, 'Veuillez entrer le prix en Dinars Tunisiens (TND)'],
    min: [0, 'Le prix doit être positif'],
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

module.exports = mongoose.model('Voiture', voitureSchema);