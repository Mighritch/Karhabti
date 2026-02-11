const Agence = require('../models/Agence')
const Voiture = require('../models/Voiture')
const Moto = require('../models/Moto')
const { validationResult } = require('express-validator')

const createAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les agents peuvent créer une agence'
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const {
      nom,
      ville,
      adresse,
      telephone,
      email,
      typeAgence,
      typeVehicule,
      etatVehicule
    } = req.body

    const agence = await Agence.create({
      nom,
      ville,
      adresse,
      telephone,
      email: email.toLowerCase(),
      typeAgence,
      typeVehicule,
      etatVehicule,
      agent: req.user._id
    })

    res.status(201).json({
      success: true,
      message: 'Agence créée avec succès et en attente de validation',
      data: agence
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l’agence',
      error: error.message
    })
  }
}

const getMyAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      })
    }

    const { typeAgence, typeVehicule, etatVehicule, status } = req.query

    const baseQuery = req.user.role === 'admin' ? {} : { agent: req.user._id }
    const filter = { ...baseQuery }

    if (typeAgence) filter.typeAgence = typeAgence
    if (typeVehicule) filter.typeVehicule = typeVehicule
    if (etatVehicule) filter.etatVehicule = etatVehicule
    if (status) filter.status = status

    let agences = await Agence.find(filter).populate('agent', 'nom prenom email')

    agences = await Promise.all(
      agences.map(async (agence) => {
        const totalVoitures = await Voiture.countDocuments({ agence: agence._id })
        const totalMotos = await Moto.countDocuments({ agence: agence._id })
        const totalVehicules = totalVoitures + totalMotos

        return {
          ...agence.toObject(),
          totalVoitures,
          totalMotos,
          totalVehicules
        }
      })
    )

    res.status(200).json({
      success: true,
      count: agences.length,
      data: agences
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    })
  }
}

const getAllAgences = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      })
    }

    const agences = await Agence.find().populate('agent', 'nom prenom email')

    res.status(200).json({
      success: true,
      count: agences.length,
      data: agences
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

const getPublicAgences = async (req, res) => {
  try {
    const { typeAgence, typeVehicule, etatVehicule } = req.query

    const filter = { status: 'approved' }

    if (typeAgence) filter.typeAgence = typeAgence
    if (typeVehicule) filter.typeVehicule = typeVehicule
    if (etatVehicule) filter.etatVehicule = etatVehicule

    const agences = await Agence.find(filter)

    res.status(200).json({
      success: true,
      count: agences.length,
      data: agences
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des agences publiques',
      error: error.message
    })
  }
}

const getPendingAgences = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      })
    }

    const agences = await Agence.find({ status: 'pending' }).populate(
      'agent',
      'nom prenom email'
    )

    res.status(200).json({
      success: true,
      count: agences.length,
      data: agences
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

const approveAgence = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      })
    }

    const { status } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      })
    }

    const agence = await Agence.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )

    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée'
      })
    }

    res.status(200).json({
      success: true,
      message: `Agence ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`,
      data: agence
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

const updateAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      })
    }

    const query =
      req.user.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, agent: req.user._id }

    const agence = await Agence.findOne(query)

    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée ou non autorisée'
      })
    }

    const fields = [
      'nom',
      'ville',
      'adresse',
      'telephone',
      'email',
      'typeAgence',
      'typeVehicule',
      'etatVehicule'
    ]

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        agence[field] = field === 'email'
          ? req.body[field].toLowerCase()
          : req.body[field]
      }
    })

    const updatedAgence = await agence.save()

    res.status(200).json({
      success: true,
      message: 'Agence modifiée avec succès',
      data: updatedAgence
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification',
      error: error.message
    })
  }
}

const deleteAgence = async (req, res) => {
  try {
    if (req.user.role !== 'agent' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      })
    }

    const query =
      req.user.role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, agent: req.user._id }

    const agence = await Agence.findOneAndDelete(query)

    if (!agence) {
      return res.status(404).json({
        success: false,
        message: 'Agence non trouvée ou non autorisée'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Agence supprimée avec succès'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression',
      error: error.message
    })
  }
}

module.exports = {
  createAgence,
  getMyAgence,
  getAllAgences,
  getPublicAgences,
  getPendingAgences,
  approveAgence,
  updateAgence,
  deleteAgence
}