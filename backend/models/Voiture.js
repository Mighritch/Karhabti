const mongoose = require('mongoose');

const voitureSchema = new mongoose.Schema({
  marque: { type: String, required: true, trim: true, maxlength: 50 },
  modele: { type: String, required: true, trim: true, maxlength: 50 },
  categorie: { type: String, required: true, trim: true },
  annee: { type: Number, required: true, min: 1900, max: new Date().getFullYear() },
  couleur: { type: String, required: true, trim: true, maxlength: 30 },
  
  // ✅ CORRIGÉ : optionnel + index sparse unique (plusieurs véhicules sans plaque OK)
  immatriculation: { type: String, trim: true, uppercase: true },
  
  kilometrage: { type: Number, required: false, min: 0 },
  etat: {
    type: String,
    enum: ['neuf', 'occasion'],
    required: [true, 'Veuillez préciser l\'état du véhicule'],
    default: 'occasion'
  },
  motorisation: { type: String, required: true, enum: ['Essence', 'Diesel', 'Électrique', 'Hybride', 'Hybride rechargeable', 'GPL'] },
  puissance: { type: Number, required: true, min: 1 },
  cylindre: { type: Number, required: true, min: 0 },
  boiteVitesse: { type: String, required: true, enum: ['Manuelle', 'Automatique', 'CVT', 'Semi-automatique'] },
  nbrVitesse: { type: Number, required: true, min: 1 },
  consommation: { type: Number, required: true, min: 0 },
  nbrPortes: { type: Number, required: true, enum: [2, 3, 4, 5] },
  nbrPlaces: { type: Number, required: true, min: 1, max: 9 },
  airbags: { type: Number, required: true, min: 0 },
  abs: { type: Boolean, default: true },
  regulateurVitesse: { type: Boolean, default: false },
  climatisation: { type: Boolean, default: false },
  cameraRecul: { type: Boolean, default: false },
  gps: { type: Boolean, default: false },
  ecranMultimedia: { type: Boolean, default: false },
  typePermis: { type: String, enum: ['B'], default: 'B', required: true },
  prix: { type: Number, required: true, min: 0 },
  images: [{ url: String, nomFichier: String }],
  agence: { type: mongoose.Schema.Types.ObjectId, ref: 'Agence', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Index sparse unique pour immatriculation
voitureSchema.index({ immatriculation: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Voiture', voitureSchema);