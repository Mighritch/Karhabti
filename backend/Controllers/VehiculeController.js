// controllers/VehiculeController.js
const Voiture = require('../models/Voiture');
const Moto = require('../models/Moto');
const axios = require('axios');

const { validationResult } = require('express-validator');

const createVoiture = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const images = req.files ? req.files.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) : [];

    const voitureData = {
      cylindre: 0,
      boiteVitesse: 'Manuelle',
      nbrVitesse: 5,
      consommation: 0,
      nbrPlaces: 5,
      airbags: 2,
      ...req.body,
      agence: req.agence._id,
      typePermis: 'B',
      images: images
    };

    // Conversion des types numériques si nécessaire
    ['annee', 'puissance', 'cylindre', 'nbrVitesse', 'consommation', 'nbrPortes', 'nbrPlaces', 'airbags', 'kilometrage'].forEach(field => {
      if (voitureData[field]) voitureData[field] = Number(voitureData[field]);
    });

    const voiture = await Voiture.create(voitureData);

    res.status(201).json({
      success: true,
      message: 'Voiture ajoutée avec succès',
      data: voiture
    });

  } catch (error) {
    console.error('Erreur createVoiture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la voiture',
      error: error.message
    });
  }
};

const createMoto = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const images = req.files ? req.files.map(file => ({
      url: `/uploads/vehicules/${file.filename}`,
      nomFichier: file.originalname
    })) : [];

    const motoData = {
      kilometrage: 0,
      typeTransmission: 'Chaîne',
      ...req.body,
      agence: req.agence._id,
      images: images
    };

    // Conversion des types numériques si nécessaire
    ['annee', 'cylindre', 'kilometrage'].forEach(field => {
      if (motoData[field]) motoData[field] = Number(motoData[field]);
    });

    const moto = await Moto.create(motoData);

    res.status(201).json({
      success: true,
      message: 'Moto ajoutée avec succès',
      data: moto
    });

  } catch (error) {
    console.error('Erreur createMoto:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la moto',
      error: error.message
    });
  }
};

const getMyVoitures = async (req, res) => {
  try {
    const voitures = await Voiture.find({ agence: req.agence._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: voitures.length,
      data: voitures
    });
  } catch (error) {
    console.error('Erreur getMyVoitures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des voitures',
      error: error.message
    });
  }
};

const getMyMotos = async (req, res) => {
  try {
    const motos = await Moto.find({ agence: req.agence._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: motos.length,
      data: motos
    });
  } catch (error) {
    console.error('Erreur getMyMotos:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des motos',
      error: error.message
    });
  }
};

const deleteVoiture = async (req, res) => {
  try {
    const voiture = await Voiture.findOneAndDelete({
      _id: req.params.id,
      agence: req.agence._id
    });

    if (!voiture) {
      return res.status(404).json({
        success: false,
        message: 'Voiture non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Voiture supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteVoiture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

const deleteMoto = async (req, res) => {
  try {
    const moto = await Moto.findOneAndDelete({
      _id: req.params.id,
      agence: req.agence._id
    });

    if (!moto) {
      return res.status(404).json({
        success: false,
        message: 'Moto non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Moto supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteMoto:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

const suggestModels = async (req, res) => {
  try {
    const { marque, type } = req.body;

    if (!marque) {
      return res.status(400).json({ success: false, message: 'La marque est requise' });
    }

    const prompt = `Donne-moi une liste de modèles populaires pour la marque de ${type || 'véhicule'} "${marque}". 
    Réponds uniquement avec une liste de noms de modèles séparés par des virgules, sans texte supplémentaire, sans numérotation. 
    Exemple pour Toyota: Corolla, Camry, RAV4, Yaris, Hilux`;

    const getAIResponse = async (model) => {
      return await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 100
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://karhabti.tn', // URL fictive mais propre pour OpenRouter
          'X-Title': 'Karhabti'
        },
        timeout: 10000
      });
    };

    // Liste de modèles gratuits à tester par ordre de préférence
    const modelsToTry = [
      "google/gemini-2.0-flash-exp:free",
      "google/gemini-2.0-flash-lite-preview-02-05:free",
      "deepseek/deepseek-chat", // Souvent très stable
      "mistralai/mistral-7b-instruct:free",
      "microsoft/phi-3-medium-128k-instruct:free"
    ];

    let response;
    let lastError;

    for (const model of modelsToTry) {
      try {
        console.log(`Tentative avec le modèle : ${model}`);
        response = await getAIResponse(model);
        if (response.data?.choices?.[0]?.message?.content) {
          break; // Succès !
        }
      } catch (err) {
        lastError = err;
        console.warn(`Le modèle ${model} a échoué. Tentative suivante...`);
        // Petite attente de 500ms avant de changer de modèle pour éviter de spammer
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!response) {
      throw lastError || new Error('Tous les modèles IA ont échoué');
    }

    const content = response.data.choices[0].message.content;
    const modeles = content.split(',').map(m => m.trim()).filter(m => m.length > 0);

    res.status(200).json({
      success: true,
      data: modeles
    });

  } catch (error) {
    console.error('Erreur suggestModels final:', error?.response?.data || error.message);
    const errorMsg = error?.response?.data?.error?.message || error.message;
    res.status(500).json({
      success: false,
      message: 'L\'IA est actuellement surchargée. Veuillez réessayer dans quelques secondes.',
      error: errorMsg
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
  suggestModels
};