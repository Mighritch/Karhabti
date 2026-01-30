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
} = require('../controllers/VehiculeController');

const upload = require('../middleware/upload');

// Importer genAI depuis le controller (ou le ré-importer ici si tu préfères)
// Attention : dans une vraie application, il vaut mieux ne pas dupliquer l’instanciation
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Toutes les routes nécessitent d'être connecté
router.use(protect);

// ────────────────────────────────────────────────
// Suggestions IA
// ────────────────────────────────────────────────

// Suggestions de modèles (marque → liste de modèles)
router.post('/suggest-models', requireApprovedAgency, suggestModels);

// Analyse IA d'une image (une seule image autorisée)
router.post('/suggest-from-image', upload.array('images', 1), requireApprovedAgency, suggestFromImage);

// ────────────────────────────────────────────────
// Création de véhicules (jusqu'à 5 images)
// ────────────────────────────────────────────────
router.post('/voitures', upload.array('images', 5), requireApprovedAgency, createVoiture);
router.post('/motos',   upload.array('images', 5), requireApprovedAgency, createMoto);

// ────────────────────────────────────────────────
// Liste des véhicules de l'agence connectée
// ────────────────────────────────────────────────
router.get('/me/voitures', requireApprovedAgency, getMyVoitures);
router.get('/me/motos',    requireApprovedAgency, getMyMotos);

// ────────────────────────────────────────────────
// Suppression
// ────────────────────────────────────────────────
router.delete('/voitures/:id', requireApprovedAgency, deleteVoiture);
router.delete('/motos/:id',    requireApprovedAgency, deleteMoto);

// ────────────────────────────────────────────────
// Route temporaire de debug Gemini (à supprimer en production !)
// ────────────────────────────────────────────────
router.get('/test-gemini-models', requireApprovedAgency, async (req, res) => {
  try {
    // En janvier 2026 → gemini-2.5-flash reste stable et largement utilisé
    // gemini-3-flash-preview existe mais est plus récent / expérimental
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
      // Infos utiles pour debug
      likelyCause:
        err.message.includes('API key') ? 'Clé API invalide ou manquante' :
        err.message.includes('not found') ? 'Modèle non disponible / mal orthographié' :
        'Erreur inconnue – voir logs serveur'
    });
  }
});

module.exports = router;