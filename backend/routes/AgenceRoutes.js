const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createAgence,
  getMyAgence
} = require('../Controllers/AgenceController');

const { body } = require('express-validator');

// Validation pour la création
const createAgenceValidator = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('ville').trim().notEmpty().withMessage('La ville est requise'),
  body('adresse').trim().notEmpty().withMessage('L\'adresse est requise'),
  body('telephone').trim().notEmpty().matches(/^\d{8,}$/).withMessage('Numéro de téléphone invalide'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('typeAgence').isIn(['vente', 'location']).withMessage('Type d\'agence invalide'),
  body('typeVehicule').isIn(['voiture', 'moto']).withMessage('Type de véhicule invalide')
];

// Routes protégées
router.use(protect); // Toutes les routes ci-dessous nécessitent un token

router
  .route('/')
  .post(createAgenceValidator, createAgence);

router
  .route('/me')
  .get(getMyAgence);

module.exports = router;