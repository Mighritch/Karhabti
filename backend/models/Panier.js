const mongoose = require('mongoose');

const panierItemSchema = new mongoose.Schema({
  vehiculeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'typeVehicule'
  },
  typeVehicule: {
    type: String,
    required: true,
    enum: ['Voiture', 'Moto']
  },
  marque: String,
  modele: String,
  annee: Number,
  prix: Number,
  imageUrl: String,
  agenceNom: String,
  etat: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const panierSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [panierItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

panierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Panier', panierSchema);