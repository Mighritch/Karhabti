const mongoose = require('mongoose');

const agenceSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  ville: { type: String, required: true },
  adresse: { type: String, required: true },
  telephone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  typeAgence: [{ type: String, enum: ['vente', 'location'], required: true }],
  typeVehicule: [{ type: String, enum: ['voiture', 'moto'], required: true }],
  etatVehicule: [{ type: String, enum: ['neuf', 'occasion'], required: false }], // Only relevant if 'vente' is in typeAgence
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },


  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Agence', agenceSchema);