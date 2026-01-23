const mongoose = require('mongoose');

const agenceSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Veuillez entrer le nom de l\'agence'],
    trim: true,
    maxlength: [100, 'Le nom ne doit pas dépasser 100 caractères']
  },
  ville: {
    type: String,
    required: [true, 'Veuillez entrer la ville'],
    trim: true,
    maxlength: [50, 'La ville ne doit pas dépasser 50 caractères']
  },
  adresse: {
    type: String,
    required: [true, 'Veuillez entrer l\'adresse'],
    trim: true,
    maxlength: [200, 'L\'adresse ne doit pas dépasser 200 caractères']
  },
  telephone: {
    type: String,
    required: [true, 'Veuillez entrer le numéro de téléphone'],
    match: [/^\d{8,}$/, 'Veuillez entrer un numéro de téléphone valide']
  },
  email: {
    type: String,
    required: [true, 'Veuillez entrer l\'email'],
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Veuillez entrer un email valide']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Agence', agenceSchema);
