const Agence = require('../models/Agence');
const { validationResult } = require('express-validator');

const createAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les agents peuvent créer une agence'
      });
    }

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

const getMyAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const query = req.user.role === 'admin' ? {} : { agent: req.user._id };
    const agences = await Agence.find(query).populate('agent', 'nom prenom email');

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

const updateAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, agent: req.user._id };

    const agence = await Agence.findOne(query);

    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée ou ne vous appartient pas'
      });
    }

    const allowedUpdates = [
      'nom', 'ville', 'adresse', 'telephone', 'email',
      'typeAgence', 'typeVehicule'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        agence[field] = req.body[field];
      }
    });

    if (req.body.email) {
      agence.email = req.body.email.toLowerCase();
    }

    const updatedAgence = await agence.save();

    res.status(200).json({
      success: true,
      message: 'Agence modifiée avec succès',
      data: updatedAgence
    });
  } catch (error) {
    console.error('Erreur update agence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification',
      error: error.message
    });
  }
};

const deleteAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, agent: req.user._id };

    const agence = await Agence.findOneAndDelete(query);

    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée ou ne vous appartient pas'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agence supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression agence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression',
      error: error.message
    });
  }
};

module.exports = {
  createAgence,
  getMyAgence,
  getAllAgences,
  getPendingAgences,
  approveAgence,
  updateAgence,
  deleteAgence
};