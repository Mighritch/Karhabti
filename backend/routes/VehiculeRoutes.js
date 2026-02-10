const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { requireApprovedAgency } = require('../middleware/agence');

const {
  createVoiture,
  updateVoiture,
  createMoto,
  updateMoto,
  getMyVoitures,
  getMyMotos,
  deleteVoiture,
  deleteMoto,
  suggestModels,
  suggestFromImage,
  getGlobalStats,
  searchVehicles, // New import
  getAllNeufsAVendre
} = require('../Controllers/VehiculeController');

const upload = require('../middleware/upload');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Public routes (avant protect)
router.get('/search', searchVehicles);
router.get('/neufs-a-vendre', getAllNeufsAVendre);
router.use(protect);

router.post('/suggest-models', requireApprovedAgency, suggestModels);

router.post('/suggest-from-image', upload.array('images', 1), requireApprovedAgency, suggestFromImage);

router.post('/voitures', upload.array('images', 5), requireApprovedAgency, createVoiture);
router.post('/motos', upload.array('images', 5), requireApprovedAgency, createMoto);

router.put('/voitures/:id', upload.array('images', 5), requireApprovedAgency, updateVoiture);
router.put('/motos/:id', upload.array('images', 5), requireApprovedAgency, updateMoto);

router.get('/me/voitures', requireApprovedAgency, getMyVoitures);
router.get('/me/motos', requireApprovedAgency, getMyMotos);

router.delete('/voitures/:id', requireApprovedAgency, deleteVoiture);
router.delete('/motos/:id', requireApprovedAgency, deleteMoto);

router.get('/stats', protect, authorize('admin'), getGlobalStats);

router.get('/test-gemini-models', requireApprovedAgency, async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Dis-moi juste "OK Gemini"');

    res.json({
      success: true,
      text: result.response.text().trim(),
      modelUsed: 'gemini-2.5-flash'
    });
  } catch (err) {
    console.error('Test Gemini error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      likelyCause:
        err.message.includes('API key') ? 'Clé API invalide ou manquante' :
        err.message.includes('not found') ? 'Modèle non disponible / mal orthographié' :
        'Erreur inconnue – voir logs serveur'
    });
  }
});

module.exports = router;