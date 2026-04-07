const mongoose = require('mongoose');

const commandeItemSchema = new mongoose.Schema({
  vehiculeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  typeVehicule: { type: String, enum: ['voiture', 'moto'], required: true },
  marque: String,
  modele: String,
  annee: Number,
  prix: Number,
  etat: { type: String, enum: ['neuf', 'occasion'] }
});

const commandeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  numeroCommande: { type: String, required: true, unique: true },
  items: [commandeItemSchema],
  total: { type: Number, required: true },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmée', 'en_preparation', 'livree', 'annulee'],
    default: 'en_attente'
  },
  informationsClient: {
    nom: String,
    prenom: String,
    telephone: String,
    email: String,
    adresse: String,
    ville: String,
    codePostal: String
  },
  methodePaiement: {
    type: String,
    enum: ['espece', 'virement', 'carte'],
    required: true
  },
  dateCommande: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Commande', commandeSchema);