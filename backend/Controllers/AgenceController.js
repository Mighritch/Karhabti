// filename: Controllers/AgenceController.js

const Agence = require('../models/Agence');
const { validationResult } = require('express-validator');

/**
 * @desc    Créer une nouvelle agence (Réservé aux agents)
 * @route   POST /api/agences
 */
const createAgence = async (req, res) => {
  try {
    // 1. Vérification rôle
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les agents peuvent créer une agence'
      });
    }

    // 2. Validation des champs (venant d'express-validator)
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

    // 3. Vérifier si l'agent a déjà une agence (Décommentez si un agent est limité à une seule agence)
    /*
    const existingAgence = await Agence.findOne({ agent: req.user._id });
    if (existingAgence) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà créé une agence'
      });
    }
    */

    // 4. Création de l'agence (le status sera 'pending' par défaut via le modèle)
    const agence = await Agence.create({
      nom,
      ville,
      adresse,
      telephone,
      email: email.toLowerCase(),
      typeAgence,
      typeVehicule,
      agent: req.user._id
    });

    // 5. Réponse succès
    res.status(201).json({
      success: true,
      message: 'Agence créée avec succès et en attente de validation',
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

/**
 * @desc    Récupérer l'agence de l'agent connecté
 * @route   GET /api/agences/my-agence
 */
const getMyAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux agents'
      });
    }

    const agences = await Agence.find({ agent: req.user._id });

    res.status(200).json({
      success: true,
      count: agences.length,
      data: agences
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

/**
 * @desc    Liste de TOUTES les agences (Admin uniquement)
 * @route   GET /api/agences
 */
const getAllAgences = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const agences = await Agence.find()
      .populate('agent', 'nom prenom email');

    res.status(200).json({
      success: true,
      count: agences.length,
      data: agences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Agences en attente de validation (Admin uniquement)
 * @route   GET /api/agences/pending
 */
const getPendingAgences = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const agences = await Agence.find({ status: 'pending' })
      .populate('agent', 'nom prenom email');

    res.status(200).json({
      success: true,
      count: agences.length,
      data: agences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Approuver une agence (Admin uniquement)
 * @route   PUT /api/agences/:id/approve
 */
const approveAgence = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const agence = await Agence.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true, runValidators: true }
    );

    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agence approuvée avec succès',
      data: agence
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createAgence,
  getMyAgence,
  getAllAgences,
  getPendingAgences,
  approveAgence
};