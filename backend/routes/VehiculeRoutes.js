// routes/VehiculeRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireApprovedAgency } = require('../middleware/agence');

const {
  createVoiture,
  createMoto,
  getMyVoitures,
  getMyMotos,
  deleteVoiture,
  deleteMoto
} = require('../Controllers/VehiculeController');

const upload = require('../middleware/upload');

// Toutes les routes nécessitent d'être connecté
router.use(protect);

// Routes réservées aux agents avec agence approuvée
router.post('/voitures', upload.array('images', 5), requireApprovedAgency, createVoiture);
router.post('/motos', upload.array('images', 5), requireApprovedAgency, createMoto);

// Lister ses propres véhicules
router.get('/me/voitures', requireApprovedAgency, getMyVoitures);
router.get('/me/motos', requireApprovedAgency, getMyMotos);

// Supprimer un véhicule
router.delete('/voitures/:id', requireApprovedAgency, deleteVoiture);
router.delete('/motos/:id', requireApprovedAgency, deleteMoto);

// (optionnel) Routes admin ou publiques
// router.get('/', getAllVehicules); // admin only
// router.get('/:id', getVehiculeById);

module.exports = router;