// src/controllers/VehiculeController.js
const Voiture = require('../models/Voiture');
const Moto = require('../models/Moto');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const USE_AI_PROVIDER = (process.env.USE_AI_PROVIDER || 'gemini').toLowerCase();

const timeoutPromise = (ms, msg = 'Timeout') =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));

// ==================== CRUD Voiture ====================
const createVoiture = async (req, res) => {
  try {
    const images = req.files?.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) || [];

    const data = { ...req.body };

    ['abs', 'regulateurVitesse', 'climatisation', 'cameraRecul', 'gps', 'ecranMultimedia'].forEach(k => {
      if (data[k] !== undefined) data[k] = data[k] === 'true' || data[k] === true || !!data[k];
    });

    ['annee', 'puissance', 'cylindre', 'nbrVitesse', 'consommation', 'nbrPortes', 'nbrPlaces', 'airbags', 'kilometrage', 'prix'].forEach(k => {
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

    ['abs', 'regulateurVitesse', 'climatisation', 'cameraRecul', 'gps', 'ecranMultimedia'].forEach(k => {
      if (data[k] !== undefined) data[k] = data[k] === 'true' || data[k] === true || !!data[k];
    });

    ['annee', 'puissance', 'cylindre', 'nbrVitesse', 'consommation', 'nbrPortes', 'nbrPlaces', 'airbags', 'kilometrage', 'prix'].forEach(k => {
      if (data[k] !== undefined && data[k] !== '') {
        const num = Number(data[k]);
        data[k] = isNaN(num) ? undefined : num;
      }
    });

    const voiture = await Voiture.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!voiture) return res.status(404).json({ success: false });

    Object.assign(voiture, data);
    voiture.images = [...voiture.images, ...newImages];
    voiture.updatedAt = Date.now();

    await voiture.save();
    res.json({ success: true, data: voiture });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==================== CRUD Moto ====================
const createMoto = async (req, res) => {
  try {
    const images = req.files?.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) || [];

    const data = { ...req.body };
    ['annee', 'cylindre', 'kilometrage', 'prix'].forEach(k => {
      if (data[k] !== undefined && data[k] !== '') {
        const num = Number(data[k]);
        data[k] = isNaN(num) ? undefined : num;
      }
    });

    data.agence = req.agence._id;
    data.images = images;

    const moto = await Moto.create(data);
    res.status(201).json({ success: true, data: moto });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateMoto = async (req, res) => {
  try {
    const newImages = req.files?.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) || [];

    const data = { ...req.body };
    ['annee', 'cylindre', 'kilometrage', 'prix'].forEach(k => {
      if (data[k] !== undefined && data[k] !== '') {
        const num = Number(data[k]);
        data[k] = isNaN(num) ? undefined : num;
      }
    });

    const moto = await Moto.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!moto) return res.status(404).json({ success: false });

    Object.assign(moto, data);
    moto.images = [...moto.images, ...newImages];
    moto.updatedAt = Date.now();

    await moto.save();
    res.json({ success: true, data: moto });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==================== Affichage ====================
const getMyVoitures = async (req, res) => {
  try {
    const voitures = await Voiture.find({ agence: req.agence._id });
    res.json({ success: true, data: voitures });
  } catch {
    res.status(500).json({ success: false });
  }
};

const getMyMotos = async (req, res) => {
  try {
    const motos = await Moto.find({ agence: req.agence._id });
    res.json({ success: true, data: motos });
  } catch {
    res.status(500).json({ success: false });
  }
};

// ==================== Suppression ====================
const deleteVoiture = async (req, res) => {
  try {
    const voiture = await Voiture.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!voiture) return res.status(404).json({ success: false });

    voiture.images.forEach(img => {
      const filePath = path.join(__dirname, '..', 'public', img.url.replace('/uploads/vehicules/', 'uploads/vehicules/'));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await voiture.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};

const deleteMoto = async (req, res) => {
  try {
    const moto = await Moto.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!moto) return res.status(404).json({ success: false });

    moto.images.forEach(img => {
      const filePath = path.join(__dirname, '..', 'public', img.url.replace('/uploads/vehicules/', 'uploads/vehicules/'));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await moto.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};

// ==================== Statistiques ====================
const getGlobalStats = async (req, res) => {
  try {
    const totalVoitures = await Voiture.countDocuments();
    const totalMotos = await Moto.countDocuments();
    res.json({
      success: true,
      data: { totalVoitures, totalMotos, totalVehicules: totalVoitures + totalMotos }
    });
  } catch {
    res.status(500).json({ success: false });
  }
};

// ==================== Recherche ====================
const searchVehicles = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query?.trim()) return res.status(400).json({ success: false });

    const searchQuery = {
      $or: [
        { marque: { $regex: query, $options: 'i' } },
        { modele: { $regex: query, $options: 'i' } },
        { immatriculation: { $regex: query, $options: 'i' } },
        { categorie: { $regex: query, $options: 'i' } },
        { typeMoto: { $regex: query, $options: 'i' } }
      ]
    };

    const voitures = await Voiture.find(searchQuery).populate('agence');
    const motos = await Moto.find(searchQuery).populate('agence');

    res.json({
      success: true,
      voitures: voitures.filter(v => v.agence?.status === 'approved'),
      motos: motos.filter(m => m.agence?.status === 'approved')
    });
  } catch {
    res.status(500).json({ success: false });
  }
};

// ==================== Véhicules à vendre ====================
const getAllNeufsAVendre = async (req, res) => {
  try {
    const typeVehicule = (req.query.typeVehicule || '').toString().trim();

    const agencePopulate = {
      path: 'agence',
      select: 'nom status typeAgence',
      match: { status: 'approved', typeAgence: { $in: ['vente'] } }
    };

    const fetchVoitures = !typeVehicule || typeVehicule === 'voiture';
    const fetchMotos = !typeVehicule || typeVehicule === 'moto';

    const voitures = fetchVoitures
      ? await Voiture.find({ etat: 'neuf' }).populate(agencePopulate)
      : [];
    const motos = fetchMotos
      ? await Moto.find({ etat: 'neuf' }).populate(agencePopulate)
      : [];

    res.json({
      success: true,
      voitures: voitures.filter(v => v.agence),
      motos: motos.filter(m => m.agence)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllOccasionsAVendre = async (req, res) => {
  try {
    const typeVehicule = (req.query.typeVehicule || '').toString().trim();

    const agencePopulate = {
      path: 'agence',
      select: 'nom status typeAgence',
      match: { status: 'approved', typeAgence: { $in: ['vente'] } }
    };

    const fetchVoitures = !typeVehicule || typeVehicule === 'voiture';
    const fetchMotos = !typeVehicule || typeVehicule === 'moto';

    const voitures = fetchVoitures
      ? await Voiture.find({ etat: 'occasion' }).populate(agencePopulate)
      : [];
    const motos = fetchMotos
      ? await Moto.find({ etat: 'occasion' }).populate(agencePopulate)
      : [];

    res.json({
      success: true,
      voitures: voitures.filter(v => v.agence),
      motos: motos.filter(m => m.agence)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== Suggestions ====================
const suggestModels = async (req, res) => {
  try {
    const { marque } = req.body || {};
    const voitureModels = await Voiture.find(marque ? { marque } : {}).distinct('modele');
    const motoModels = await Moto.find(marque ? { marque } : {}).distinct('modele');
    const models = Array.from(new Set([...voitureModels, ...motoModels]));
    res.json({ success: true, models });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const suggestFromImage = async (req, res) => {
  let imagePath = null;
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }

    const imageFile = req.files[0];
    imagePath = imageFile.path;
    const fileData = fs.readFileSync(imagePath);
    const base64Image = fileData.toString('base64');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `Tu es un expert en identification de véhicules (voitures et motos) pour le marché tunisien.
Analyse cette photo et retourne UNIQUEMENT un JSON valide (aucun texte avant/après).
{
  "marque": string,
  "modele": string,
  "annee": number | null,
  "couleur": string,
  "prixEstime": number | null,
  "confiance": number,
  "description": string,
  "etat": "neuf" | "occasion" | null,
  "kilometrage": number | null,
  "type": "voiture" | "moto" | null,
  "categorie": string | null,
  "puissance": number | null,
  "cylindre": number | null
}`;

    const imagePart = { inlineData: { data: base64Image, mimeType: imageFile.mimetype || 'image/jpeg' } };
    const generatePromise = model.generateContent([prompt, imagePart]);

    const result = await Promise.race([
      generatePromise,
      timeoutPromise(45000, 'Timeout analyse Gemini (45s)')
    ]);

    const responseText = result.response.text().trim();
    let parsed = JSON.parse(responseText);

    const data = {
      marque: parsed.marque || 'Inconnu',
      modele: parsed.modele || 'Inconnu',
      annee: parsed.annee ? Number(parsed.annee) : undefined,
      couleur: parsed.couleur || undefined,
      prixEstime: parsed.prixEstime ? Number(parsed.prixEstime) : undefined,
      confiance: typeof parsed.confiance === 'number' ? Math.max(0, Math.min(1, parsed.confiance)) : 0,
      description: parsed.description || `Véhicule détecté : ${parsed.marque || ''} ${parsed.modele || ''}`,
      etat: parsed.etat || undefined,
      kilometrage: parsed.kilometrage ? Number(parsed.kilometrage) : undefined,
      type: parsed.type || undefined,
      categorie: parsed.categorie || undefined,
      puissance: parsed.puissance ? Number(parsed.puissance) : undefined,
      cylindre: parsed.cylindre ? Number(parsed.cylindre) : undefined
    };

    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    res.json({ success: true, data });
  } catch (err) {
    if (imagePath && fs.existsSync(imagePath)) { try { fs.unlinkSync(imagePath); } catch {} }

    res.json({
      success: true,
      data: {
        marque: 'Inconnu',
        modele: 'Inconnu',
        annee: undefined,
        couleur: undefined,
        prixEstime: undefined,
        confiance: 0,
        description: 'Modèle non identifié (erreur IA)'
      }
    });
  }
};

// ==================== Export ====================
module.exports = {
  createVoiture,
  updateVoiture,
  createMoto,
  updateMoto,
  getMyVoitures,
  getMyMotos,
  deleteVoiture,
  deleteMoto,
  getGlobalStats,
  searchVehicles,
  getAllNeufsAVendre,
  getAllOccasionsAVendre,
  suggestModels,
  suggestFromImage
};