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
    ['annee', 'puissance', 'cylindre', 'nbrVitesse', 'consommation', 'nbrPortes', 'nbrPlaces', 'airbags', 'kilometrage', 'prix']
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

const updateVoiture = async (req, res) => {
  try {
    const newImages = req.files?.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) || [];

    const data = { ...req.body };

    // Conversions similaires à create
    ['abs', 'regulateurVitesse', 'climatisation', 'cameraRecul', 'gps', 'ecranMultimedia']
      .forEach(k => {
        if (data[k] !== undefined) {
          data[k] = data[k] === 'true' || data[k] === true || !!data[k];
        }
      });

    ['annee', 'puissance', 'cylindre', 'nbrVitesse', 'consommation', 'nbrPortes', 'nbrPlaces', 'airbags', 'kilometrage', 'prix']
      .forEach(k => {
        if (data[k] !== undefined && data[k] !== '') {
          const num = Number(data[k]);
          data[k] = isNaN(num) ? undefined : num;
        }
      });

    // Trouver la voiture existante
    const voiture = await Voiture.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!voiture) {
      return res.status(404).json({ success: false, message: 'Voiture non trouvée' });
    }

    // Mise à jour des champs
    Object.assign(voiture, data);

    // Ajouter nouvelles images aux existantes (pas de suppression automatique ici)
    voiture.images = [...voiture.images, ...newImages];

    // Mise à jour timestamp
    voiture.updatedAt = Date.now();

    await voiture.save();

    res.json({
      success: true,
      message: 'Voiture mise à jour avec succès',
      data: voiture
    });
  } catch (err) {
    console.error('updateVoiture error:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la voiture',
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

    ['annee', 'cylindre', 'kilometrage', 'prix']
      .forEach(k => {
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

const updateMoto = async (req, res) => {
  try {
    const newImages = req.files?.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) || [];

    const data = { ...req.body };

    ['annee', 'cylindre', 'kilometrage', 'prix']
      .forEach(k => {
        if (data[k] !== undefined && data[k] !== '') {
          const num = Number(data[k]);
          data[k] = isNaN(num) ? undefined : num;
        }
      });

    // Trouver la moto existante
    const moto = await Moto.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!moto) {
      return res.status(404).json({ success: false, message: 'Moto non trouvée' });
    }

    // Mise à jour des champs
    Object.assign(moto, data);

    // Ajouter nouvelles images aux existantes
    moto.images = [...moto.images, ...newImages];

    // Mise à jour timestamp
    moto.updatedAt = Date.now();

    await moto.save();

    res.json({
      success: true,
      message: 'Moto mise à jour avec succès',
      data: moto
    });
  } catch (err) {
    console.error('updateMoto error:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la moto',
      error: err.message
    });
  }
};

// ────────────────────────────────────────────────
// Autres fonctions CRUD & utilitaires
// ────────────────────────────────────────────────
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

    if (USE_AI_PROVIDER !== 'gemini') {
      return res.status(503).json({
        success: false,
        message: 'Seul le provider Gemini est supporté dans cette version'
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const result = await Promise.race([
      timeoutPromise(12000, 'Timeout suggestion modèles'),
      model.generateContent(prompt)
    ]);

    const parsed = JSON.parse(result.response.text());
    const models = parsed.models || [];

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

    const prompt = `Tu es un expert en reconnaissance automobile et moto, spécialisé dans le marché tunisien (Tunisie 2025-2026).
Analyse cette image UNIQUE et retourne **UNIQUEMENT** un JSON valide :
{
  "marque": "Toyota | Peugeot | Renault | Hyundai | Kia | Volkswagen | ... | Inconnu",
  "modele": "208 | Clio | Symbol | Polo | Tucson | Duster | ... | ",
  "type": "Citadine | Berline | SUV / Crossover | Compacte | Monospace | Routière | Sportive | Scooter | ...",
  "couleur": "Noir | Blanc | Gris | Argent | Bleu | Rouge | Beige | ... | Inconnu",
  "prixEstime": 45000,
  "confiance": 0.92
}
Important :
- "prixEstime" doit être une estimation réaliste du prix de vente actuel en Tunisie en DINARS TUNISIENS (TND), nombre entier, sans décimales, adapté au marché local occasion/neuf en 2026.
- Ne mets jamais de symbole € ou $ ou devise autre que le nombre brut.
- Si tu ne reconnais pas bien le véhicule, mets un prix très approximatif ou 0 et baisse fortement "confiance".`;

    if (USE_AI_PROVIDER !== 'gemini') {
      return res.status(503).json({
        success: false,
        message: 'Seul le provider Gemini est supporté dans cette version'
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
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

    // Sécurité sur prixEstime
    detected.prixEstime = Number(detected.prixEstime) || 0;
    if (detected.prixEstime < 0) {
      detected.prixEstime = 0;
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
  updateVoiture,
  createMoto,
  updateMoto,
  getMyVoitures,
  getMyMotos,
  deleteVoiture,
  deleteMoto,
  suggestModels,
  suggestFromImage
};