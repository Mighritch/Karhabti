const express = require('express');
const router = express.Router();

const {
  createAgence,
  getMyAgence,
  getAllAgences,
  getPendingAgences,
  approveAgence,
  updateAgence,
  deleteAgence,
  getPublicAgences  // MODIFICATION AJOUTÉE: Import de la nouvelle fonction
} = require('../Controllers/AgenceController');

const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');


const createAgenceValidator = [
  body('nom').trim().notEmpty().withMessage('Le nom est requis'),
  body('ville').trim().notEmpty().withMessage('La ville est requise'),
  body('adresse').trim().notEmpty().withMessage('L\'adresse est requise'),
  body('telephone')
    .trim()
    .notEmpty()
    .matches(/^\d{8,}$/)
    .withMessage('Numéro de téléphone invalide (minimum 8 chiffres)'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('typeAgence')
    .isIn(['vente', 'location'])
    .withMessage('Type d\'agence invalide (vente ou location)'),
  body('typeVehicule')
    .isIn(['voiture', 'moto'])
    .withMessage('Type de véhicule invalide (voiture ou moto)')
];

// ────────────────────────────────────────────────
//  ROUTES AGENTS (authentifiés)
// ────────────────────────────────────────────────
router.post('/', protect, createAgenceValidator, createAgence);

router.get('/my-agence', protect, getMyAgence);

router.put('/:id', protect, updateAgence);

router.delete('/:id', protect, deleteAgence);

// ────────────────────────────────────────────────
//  ROUTES ADMIN (authentifiés + rôle admin)
// ────────────────────────────────────────────────
router.get('/', protect, authorize('admin'), getAllAgences);

router.get('/pending', protect, authorize('admin'), getPendingAgences);

router.put('/:id/approve', protect, authorize('admin'), approveAgence);

// ────────────────────────────────────────────────
//  ROUTES PUBLIQUES (optionnel – à activer plus tard)
// ────────────────────────────────────────────────
router.get('/public', getPublicAgences);  // MODIFICATION AJOUTÉE: Activation de la route publique pour les users normaux

module.exports = router;