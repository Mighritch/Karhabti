// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/karhabti';
        await mongoose.connect(mongoUri);
        console.log('Connecté à MongoDB avec succès !');
    } catch (err) {
        console.error('Erreur de connexion à MongoDB :', err.message);
        process.exit(1); // Arrête complètement l'application si pas de DB
    }
};

module.exports = connectDB;