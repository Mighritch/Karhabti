const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Veuillez entrer votre nom'],
    trim: true,
    maxlength: [50, 'Le nom ne doit pas dépasser 50 caractères']
  },
  prenom: {
    type: String,
    required: [true, 'Veuillez entrer votre prénom'],
    trim: true,
    maxlength: [50, 'Le prénom ne doit pas dépasser 50 caractères']
  },
  dateNaissance: {
    type: Date,
    required: [true, 'Veuillez entrer votre date de naissance']
  },
  telephone: {
    type: String,
    required: [true, 'Veuillez entrer votre numéro de téléphone'],
    match: [/^\d{8,}$/, 'Veuillez entrer un numéro de téléphone valide']
  },
  email: {
    type: String,
    required: [true, 'Veuillez entrer votre email'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Veuillez entrer un email valide']
  },
  mdp: {
    type: String,
    required: [true, 'Veuillez entrer votre mot de passe'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'agent', 'admin'],
    default: 'user',           // ← valeur par défaut si rien n'est envoyé
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hachage du mot de passe avant de sauvegarder
userSchema.pre('save', async function(next) {
  if (!this.isModified('mdp')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.mdp = await bcrypt.hash(this.mdp, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparerMotDePasse = async function(mdpEntree) {
  return await bcrypt.compare(mdpEntree, this.mdp);
};

module.exports = mongoose.model('User', userSchema);