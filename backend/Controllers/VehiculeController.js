const Voiture = require('../models/Voiture');
const Moto = require('../models/Moto');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const USE_AI_PROVIDER = (process.env.USE_AI_PROVIDER || 'gemini').toLowerCase();

const timeoutPromise = (ms, msg = 'Timeout') =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));

const createVoiture = async (req, res) => {
  try {
    const images = req.files?.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) || [];

    const data = { ...req.body };

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

    const voiture = await Voiture.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!voiture) {
      return res.status(404).json({ success: false, message: 'Voiture non trouvée' });
    }

    Object.assign(voiture, data);
    voiture.images = [...voiture.images, ...newImages];
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

    const moto = await Moto.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!moto) {
      return res.status(404).json({ success: false, message: 'Moto non trouvée' });
    }

    Object.assign(moto, data);
    moto.images = [...moto.images, ...newImages];
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
    const voiture = await Voiture.findOneAndDelete({ _id: req.params.id, agence: req.agence._id });
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
    const moto = await Moto.findOneAndDelete({ _id: req.params.id, agence: req.agence._id });
    if (!moto) {
      return res.status(404).json({ success: false, message: 'Moto non trouvée' });
    }
    res.json({ success: true, message: 'Moto supprimée avec succès' });
  } catch (err) {
    console.error('deleteMoto error:', err);
    res.status(500).json({ success: false, message: 'Erreur suppression moto' });
  }
};

const suggestModels = async (req, res) => {
  try {
    const { marque, type = 'véhicule' } = req.body;
    if (!marque?.trim()) {
      return res.status(400).json({ success: false, message: 'La marque est requise' });
    }

    const prompt = `Liste de 8 à 12 modèles populaires pour la marque "${marque}" (${type}). Réponds **uniquement** avec un JSON valide : { "models": ["Modèle 1", "Modèle 2", ...] }`;

    if (USE_AI_PROVIDER !== 'gemini') {
      return res.status(503).json({ success: false, message: 'Seul le provider Gemini est supporté dans cette version' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });

    const result = await Promise.race([
      timeoutPromise(12000, 'Timeout suggestion modèles'),
      model.generateContent(prompt)
    ]);

    const parsed = JSON.parse(result.response.text());
    const models = parsed.models || [];

    res.json({ success: true, data: models });
  } catch (err) {
    console.error('suggestModels error:', err);
    res.status(500).json({ success: false, message: 'Erreur suggestion modèles' });
  }
};

const suggestFromImage = async (req, res) => {
  try {
    const filePath = req.file?.path;
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }

    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');

    const prompt = `Analyse cette image de véhicule et fournis les informations suivantes en JSON :
    {
      "marque": "nom de la marque",
      "modele": "nom du modèle précis",
      "annee": estimation de l'année (nombre),
      "type": "Voiture" ou "Moto",
      "description": "bref descriptif commercial",
      "prixEstime": estimation prix en euros (nombre),
      "confiance": score entre 0 et 1
    }`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });

    const result = await Promise.race([
      timeoutPromise(20000, 'Timeout analyse image'),
      model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
      ])
    ]);

    const detected = JSON.parse(result.response.text());

    detected.confiance = Number(detected.confiance) || 0.45;
    if (detected.confiance < 0 || detected.confiance > 1) {
      detected.confiance = 0.45;
    }

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
      status = 404;
    }

    res.status(status).json({ success: false, message, error: err.message });
  }
};

const getGlobalStats = async (req, res) => {
  try {
    const totalVoitures = await Voiture.countDocuments();
    const totalMotos    = await Moto.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalVoitures,
        totalMotos,
        totalVehicules: totalVoitures + totalMotos
      }
    });
  } catch (err) {
    console.error('getGlobalStats error:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques globales',
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
  suggestFromImage,
  getGlobalStats
};