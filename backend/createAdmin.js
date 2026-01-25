require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // ✅ chemin correct

mongoose.connect('mongodb://127.0.0.1:27017/karhabti', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

async function createAdmin() {
  try {
    const exists = await User.findOne({ email: 'admin@karhabti.com' });
    if (exists) {
      console.log('⚠️ Admin déjà existant');
      return process.exit();
    }

    await User.create({
      nom: 'Super',
      prenom: 'Admin',
      email: 'admin@karhabti.com',
      telephone: '12345678',
      dateNaissance: new Date('1995-01-01'),
      mdp: 'admin123', // ✅ Pass plain password, model will hash it
      role: 'admin'
    });

    console.log('🎉 Admin créé avec succès');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
