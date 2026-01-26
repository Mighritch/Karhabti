const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

require('./models/User'); // Register User schema first
const Agence = require('./models/Agence');

async function checkAgences() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karhabti');
        const agences = await Agence.find().populate('agent', 'nom prenom email role');
        console.log(JSON.stringify(agences, null, 2));
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAgences();
