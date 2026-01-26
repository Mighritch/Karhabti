const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createAgence,
  getMyAgence,
  getAllAgences,
  getPendingAgences,
  approveAgence
} = require('../Controllers/AgenceController');

const { body } = require('express-validator');

// --- Validations ---
const createAgenceValidator = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('ville').trim().notEmpty().withMessage('La ville est requise'),
  body('adresse').trim().notEmpty().withMessage('L\'adresse est requise'),
  body('telephone').trim().notEmpty().matches(/^\d{8,}$/).withMessage('Numéro de téléphone invalide'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('typeAgence').isIn(['vente', 'location']).withMessage('Type d\'agence invalide'),
  body('typeVehicule').isIn(['voiture', 'moto']).withMessage('Type de véhicule invalide')
];

// --- Routes Protégées (Nécessitent un token) ---
router.use(protect);

/**
 * Routes pour les AGENTS
 */
// Créer une agence
router.post('/', createAgenceValidator, createAgence);

// Récupérer l'agence de l'agent connecté
router.get('/me', getMyAgence);

/**
 * Routes pour les ADMINS
 */
// Liste de toutes les agences
router.get('/all', getAllAgences);

// Agences en attente de validation
router.get('/pending', getPendingAgences);

// Approuver une agence spécifique
router.put('/:id/approve', approveAgence);

module.exports = router;