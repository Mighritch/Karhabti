// filename: Controllers/AgenceController.js

const Agence = require('../models/Agence');
const { validationResult } = require('express-validator');

const createAgence = async (req, res) => {
  try {
    // 1. Vérification rôle
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les agents peuvent créer une agence'
      });
    }

    // 2. Validation des champs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      nom,
      ville,
      adresse,
      telephone,
      email,
      typeAgence,
      typeVehicule
    } = req.body;

    // 3. Vérifier si l'agent a déjà une agence (optionnel – décommente si besoin)
    // const existingAgence = await Agence.findOne({ agent: req.user.id });
    // if (existingAgence) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Vous avez déjà créé une agence'
    //   });
    // }

    // 4. Création de l'agence
    const agence = await Agence.create({
      nom,
      ville,
      adresse,
      telephone,
      email: email.toLowerCase(),
      typeAgence,
      typeVehicule,
      agent: req.user.id
    });

    // 5. Réponse succès
    res.status(201).json({
      success: true,
      message: 'Agence créée avec succès',
      data: agence
    });

  } catch (error) {
    console.error('Erreur création agence :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l\'agence',
      error: error.message
    });
  }
};

const getMyAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux agents'
      });
    }

    const agence = await Agence.findOne({ agent: req.user.id });

    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Vous n\'avez pas encore créé d\'agence'
      });
    }

    res.status(200).json({
      success: true,
      data: agence
    });

  } catch (error) {
    console.error('Erreur getMyAgence :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

module.exports = {
  createAgence,
  getMyAgence
};