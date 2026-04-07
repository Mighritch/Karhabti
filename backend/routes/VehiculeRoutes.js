// routes/VehiculeRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireApprovedAgency } = require('../middleware/agence');
const upload = require('../middleware/upload');
const {
  createVoiture,
  updateVoiture,
  createMoto,
  updateMoto,
  getMyVoitures,
  getMyMotos,
  deleteVoiture,
  deleteMoto,
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  getAllNeufsAVendre,
  getAllOccasionsAVendre,
  searchVehicles,
  passerCommande
} = require('../Controllers/VehiculeController');

router.get('/search', searchVehicles);
router.get('/neufs-a-vendre', getAllNeufsAVendre);
router.get('/occasions-a-vendre', getAllOccasionsAVendre);

router.use(protect);

router.post('/panier/add', addToCart);
router.get('/panier', getCart);
router.delete('/panier/:itemId', removeFromCart);
router.delete('/panier/clear', clearCart);

router.post('/commande', passerCommande);

router.post('/voitures', upload.array('images', 5), requireApprovedAgency, createVoiture);
router.put('/voitures/:id', upload.array('images', 5), requireApprovedAgency, updateVoiture);
router.get('/me/voitures', requireApprovedAgency, getMyVoitures);
router.delete('/voitures/:id', requireApprovedAgency, deleteVoiture);

router.post('/motos', upload.array('images', 5), requireApprovedAgency, createMoto);
router.put('/motos/:id', upload.array('images', 5), requireApprovedAgency, updateMoto);
router.get('/me/motos', requireApprovedAgency, getMyMotos);
router.delete('/motos/:id', requireApprovedAgency, deleteMoto);

module.exports = router;