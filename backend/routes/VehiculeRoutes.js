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
  deleteMoto,
  suggestModels,
  suggestFromImage
} = require('../Controllers/VehiculeController');

const upload = require('../middleware/upload');

router.use(protect);

router.post('/suggest-models', requireApprovedAgency, suggestModels);

router.post('/suggest-from-image', upload.array('images', 1), requireApprovedAgency, suggestFromImage);

router.post('/voitures', upload.array('images', 5), requireApprovedAgency, createVoiture);
router.post('/motos', upload.array('images', 5), requireApprovedAgency, createMoto);

router.get('/me/voitures', requireApprovedAgency, getMyVoitures);
router.get('/me/motos', requireApprovedAgency, getMyMotos);

router.delete('/voitures/:id', requireApprovedAgency, deleteVoiture);
router.delete('/motos/:id', requireApprovedAgency, deleteMoto);

module.exports = router;