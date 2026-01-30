// VehiculeController.js (no changes needed, as the AI call succeeded with 'gemini-2.5-flash'; model is still available in Jan 2026 per sources)
const Voiture = require('../models/Voiture');
const Moto = require('../models/Moto');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const USE_AI_PROVIDER = (process.env.USE_AI_PROVIDER || 'gemini').toLowerCase();

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
const timeoutPromise = (ms, msg = 'Timeout') =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));

// ────────────────────────────────────────────────
// CRUD – VOITURES
// ────────────────────────────────────────────────
const createVoiture = async (req, res) => {
  try {
    const images = req.files?.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) || [];

    const data = { ...req.body };

    // Conversion booléens
    ['abs', 'regulateurVitesse', 'climatisation', 'cameraRecul', 'gps', 'ecranMultimedia']
      .forEach(k => {
        if (data[k] !== undefined) {
          data[k] = data[k] === 'true' || data[k] === true || !!data[k];
        }
      });

    // Conversion nombres
    ['annee', 'puissance', 'cylindre', 'nbrVitesse', 'consommation', 'nbrPortes', 'nbrPlaces', 'airbags', 'kilometrage']
      .forEach(k => {
        if (data[k] !== undefined && data[k] !== '') {
          const num = Number(data[k]);
          data[k] = isNaN(num) ? undefined : num;
        }
      });

    data.agence = req.agence._id;
    data.images = images;

    const voiture = await Voiture.create(data);

    res.status(201).json({
      success: true,
      message: 'Voiture ajoutée avec succès',
      data: voiture
    });
  } catch (err) {
    console.error('createVoiture error:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la voiture',
      error: err.message
    });
  }
};

// ────────────────────────────────────────────────
// CRUD – MOTOS
// ────────────────────────────────────────────────
const createMoto = async (req, res) => {
  try {
    const images = req.files?.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) || [];

    const data = { ...req.body };

    ['annee', 'cylindre', 'kilometrage'].forEach(k => {
      if (data[k] !== undefined && data[k] !== '') {
        const num = Number(data[k]);
        data[k] = isNaN(num) ? undefined : num;
      }
    });

    data.agence = req.agence._id;
    data.images = images;

    const moto = await Moto.create(data);

    res.status(201).json({
      success: true,
      message: 'Moto ajoutée avec succès',
      data: moto
    });
  } catch (err) {
    console.error('createMoto error:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la moto',
      error: err.message
    });
  }
};

const getMyVoitures = async (req, res) => {
  try {
    const voitures = await Voiture.find({ agence: req.agence._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: voitures.length,
      data: voitures
    });
  } catch (err) {
    console.error('getMyVoitures error:', err);
    res.status(500).json({ success: false, message: 'Erreur récupération voitures' });
  }
};

const getMyMotos = async (req, res) => {
  try {
    const motos = await Moto.find({ agence: req.agence._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: motos.length,
      data: motos
    });
  } catch (err) {
    console.error('getMyMotos error:', err);
    res.status(500).json({ success: false, message: 'Erreur récupération motos' });
  }
};

const deleteVoiture = async (req, res) => {
  try {
    const voiture = await Voiture.findOneAndDelete({
      _id: req.params.id,
      agence: req.agence._id
    });

    if (!voiture) {
      return res.status(404).json({ success: false, message: 'Voiture non trouvée' });
    }

    res.json({ success: true, message: 'Voiture supprimée avec succès' });
  } catch (err) {
    console.error('deleteVoiture error:', err);
    res.status(500).json({ success: false, message: 'Erreur suppression voiture' });
  }
};

const deleteMoto = async (req, res) => {
  try {
    const moto = await Moto.findOneAndDelete({
      _id: req.params.id,
      agence: req.agence._id
    });

    if (!moto) {
      return res.status(404).json({ success: false, message: 'Moto non trouvée' });
    }

    res.json({ success: true, message: 'Moto supprimée avec succès' });
  } catch (err) {
    console.error('deleteMoto error:', err);
    res.status(500).json({ success: false, message: 'Erreur suppression moto' });
  }
};

// ────────────────────────────────────────────────
// SUGGEST MODELS (marque → liste de modèles)
// ────────────────────────────────────────────────
const suggestModels = async (req, res) => {
  try {
    const { marque, type = 'véhicule' } = req.body;

    if (!marque?.trim()) {
      return res.status(400).json({ success: false, message: 'La marque est requise' });
    }

    const prompt = `Liste de 8 à 12 modèles populaires pour la marque "${marque}" (${type}).
Réponds **uniquement** avec un JSON valide :
{ "models": ["Modèle 1", "Modèle 2", ...] }`;

    let models = [];

    if (USE_AI_PROVIDER !== 'gemini') {
      return res.status(503).json({
        success: false,
        message: 'Seul le provider Gemini est supporté dans cette version'
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',           // version stable et rapide en 2025-2026
      generationConfig: { responseMimeType: 'application/json' }
    });

    const result = await Promise.race([
      timeoutPromise(12000, 'Timeout suggestion modèles'),
      model.generateContent(prompt)
    ]);

    const parsed = JSON.parse(result.response.text());
    models = parsed.models || [];

    res.json({ success: true, data: models });
  } catch (err) {
    console.error('suggestModels error:', err);

    let message = 'Service de suggestion temporairement indisponible';
    let status = 503;

    if (err.message.includes('Timeout')) {
      message = 'Délai dépassé – réessayez plus tard';
    } else if (err.status === 404 || err.message.toLowerCase().includes('not found')) {
      message = 'Modèle Gemini non disponible. Vérifiez votre clé API ou essayez "gemini-2.5-flash-latest"';
      status = 400;
    }

    res.status(status).json({ success: false, message });
  }
};

// ────────────────────────────────────────────────
// SUGGEST FROM IMAGE (Gemini – vision)
// ────────────────────────────────────────────────
const suggestFromImage = async (req, res) => {
  let filePath = null;

  try {
    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }

    const file = req.files[0];
    filePath = file.path;

    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ success: false, message: 'Fichier image introuvable' });
    }

    const stats = fs.statSync(filePath);
    if (stats.size > 5 * 1024 * 1024) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Image trop volumineuse (max 5 Mo)' });
    }

    const base64Image = fs.readFileSync(filePath).toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';

    const prompt = `Tu es un expert en reconnaissance automobile et moto.
Analyse cette image UNIQUE et retourne **UNIQUEMENT** un JSON valide :

{
  "marque":   "Toyota | Peugeot | BMW | Honda | ... | Inconnu",
  "modele":   "208 | Clio | Civic | MT-07 | ... | ",
  "type":     "Citadine | Berline | SUV / Crossover | Sportive | Cabriolet | Routière | Naked | Trail/Adventure | Scooter | ...",
  "couleur":  "Noir | Blanc | Gris | Rouge | Bleu | Argent | ... | Inconnu",
  "confiance": 0.92
}`;

    if (USE_AI_PROVIDER !== 'gemini') {
      return res.status(503).json({
        success: false,
        message: 'Seul le provider Gemini est supporté dans cette version'
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',           // support multimodal / vision – stable en 2026
      generationConfig: { responseMimeType: 'application/json' }
    });

    const genResult = await Promise.race([
      timeoutPromise(60000, 'Timeout analyse image'),
      model.generateContent([
        { inlineData: { mimeType, data: base64Image } },
        { text: prompt }
      ])
    ]);

    const detected = JSON.parse(genResult.response.text());

    // Sécurité sur le score de confiance
    detected.confiance = Number(detected.confiance) || 0.45;
    if (detected.confiance < 0 || detected.confiance > 1) {
      detected.confiance = 0.45;
    }

    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: detected,
      debug: { provider: 'gemini-2.5-flash' }
    });

  } catch (err) {
    console.error('suggestFromImage error:', err);

    let message = 'Échec de l’analyse IA de l’image';
    let status = 500;

    if (err.message.includes('Timeout')) {
      message = 'Analyse trop longue – image complexe ou serveur lent';
      status = 504;
    } else if (err.status === 404 || err.message.toLowerCase().includes('not found')) {
      message = 'Modèle Gemini non disponible. Vérifiez votre clé API ou essayez "gemini-2.5-flash-latest"';
      status = 400;
    }

    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.status(status).json({
      success: false,
      message,
      error: err.message
    });
  }
};

module.exports = {
  createVoiture,
  createMoto,
  getMyVoitures,
  getMyMotos,
  deleteVoiture,
  deleteMoto,
  suggestModels,
  suggestFromImage
};