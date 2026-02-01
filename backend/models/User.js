const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 

const userSchema = new mongoose.Schema({
  nom: { type: String, required: [true, 'Veuillez entrer votre nom'], trim: true },
  prenom: { type: String, required: [true, 'Veuillez entrer votre prénom'], trim: true },
  dateNaissance: { type: Date, required: [true, 'Veuillez entrer votre date de naissance'] },
  telephone: { type: String, required: [true, 'Veuillez entrer votre numéro de téléphone'] },
  email: { type: String, required: [true, 'Veuillez entrer votre email'], unique: true, lowercase: true },
  mdp: { type: String, required: [true, 'Veuillez entrer votre mot de passe'], minlength: 6, select: false },
  role: { type: String, enum: ['user', 'agent', 'admin'], default: 'user', required: true },
  
  // Nouveaux champs pour la réinitialisation
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  createdAt: { type: Date, default: Date.now }
});

// Hachage du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('mdp')) return next();
  const salt = await bcrypt.genSalt(10);
  this.mdp = await bcrypt.hash(this.mdp, salt);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparerMotDePasse = async function(mdpSaisi) {
  return await bcrypt.compare(mdpSaisi, this.mdp);
};

// Méthode pour générer le token de réinitialisation
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hasher le token et le mettre dans le champ resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Expiration après 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);