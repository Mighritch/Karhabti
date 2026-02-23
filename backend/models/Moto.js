const mongoose = require('mongoose');

const motoSchema = new mongoose.Schema({
  marque: { type: String, required: true, trim: true, maxlength: 50 },
  modele: { type: String, required: true, trim: true, maxlength: 50 },
  annee: { type: Number, required: true, min: 1900, max: new Date().getFullYear() },
  couleur: { type: String, required: true, trim: true, maxlength: 30 },
  motorisation: { type: String, required: true, enum: ['Essence', 'Diesel', 'Électrique', 'Hybride'] },
  cylindre: { type: Number, required: true, min: 0 },
  boiteVitesse: { type: String, required: true, enum: ['Manuelle', 'Automatique', 'CVT'] },
  typeTransmission: { type: String, required: true, enum: ['Chaîne', 'Courroie', 'Arbre'] },
  typeMoto: { type: String, required: true, enum: ['Routière', 'Sportive', 'Cruiser', 'Touring', 'Naked', 'Enduro', 'Trail', 'Scooter', 'Maxi-scooter'] },
  kilometrage: { type: Number, required: false, min: 0 },
  etat: {
    type: String,
    enum: ['neuf', 'occasion'],
    required: [true, 'Veuillez préciser l\'état'],
    default: 'occasion'
  },
  typePermis: { type: String, required: true, enum: ['A1', 'A'] },
  
  // ✅ CORRIGÉ : optionnel + sparse unique
  immatriculation: { type: String, trim: true, uppercase: true },
  
  prix: { type: Number, required: true, min: 0 },
  images: [{ url: String, nomFichier: String }],
  agence: { type: mongoose.Schema.Types.ObjectId, ref: 'Agence', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Index sparse unique
motoSchema.index({ immatriculation: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Moto', motoSchema);