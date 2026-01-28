const Voiture = require('../models/Voiture');
const Moto = require('../models/Moto');
const axios = require('axios');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const createVoiture = async (req, res) => {
  try {
    // Optionnel : garder la validation si vous avez des middlewares express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const images = req.files
      ? req.files.map(file => ({
          url: `/uploads/vehicules/${file.filename}`,
          nomFichier: file.originalname
        }))
      : [];

    const data = { ...req.body };

    // Conversion des champs booléens envoyés sous forme de string ("true"/"false")
    [
      'abs',
      'regulateurVitesse',
      'climatisation',
      'cameraRecul',
      'gps',
      'ecranMultimedia'
    ].forEach(field => {
      if (data[field] !== undefined) {
        data[field] = data[field] === 'true' || data[field] === true;
      }
    });

    // Conversion numérique sécurisée (ne force pas si champ absent)
    [
      'annee',
      'puissance',
      'cylindre',
      'nbrVitesse',
      'consommation',
      'nbrPortes',
      'nbrPlaces',
      'airbags',
      'kilometrage'
    ].forEach(field => {
      if (data[field] !== undefined && data[field] !== '') {
        const num = Number(data[field]);
        data[field] = isNaN(num) ? undefined : num;
      }
    });

    // Champs obligatoires / fixes
    data.agence = req.agence._id;
    data.images = images;

    const voiture = await Voiture.create(data);

    res.status(201).json({
      success: true,
      message: 'Voiture ajoutée avec succès',
      data: voiture
    });
  } catch (error) {
    console.error('Erreur createVoiture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l’ajout de la voiture',
      error: error.message
    });
  }
};

const createMoto = async (req, res) => {
  try {
    // Optionnel : validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const images = req.files
      ? req.files.map(file => ({
          url: `/uploads/vehicules/${file.filename}`,
          nomFichier: file.originalname
        }))
      : [];

    const data = { ...req.body };

    // Conversion numérique pour les champs moto pertinents
    ['annee', 'cylindre', 'kilometrage'].forEach(field => {
      if (data[field] !== undefined && data[field] !== '') {
        const num = Number(data[field]);
        data[field] = isNaN(num) ? undefined : num;
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
  } catch (error) {
    console.error('Erreur createMoto:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l’ajout de la moto',
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
      return res.status(404).json({ success: false, message: 'Voiture non trouvée' });
    }

    res.status(200).json({ success: true, message: 'Voiture supprimée avec succès' });
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
      return res.status(404).json({ success: false, message: 'Moto non trouvée' });
    }

    res.status(200).json({ success: true, message: 'Moto supprimée avec succès' });
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
    if (!marque?.trim()) {
      return res.status(400).json({ success: false, message: 'La marque est requise' });
    }

    const prompt = `Donne-moi une liste de modèles populaires pour la marque de ${type || 'véhicule'} "${marque}". Réponds uniquement avec une liste de noms de modèles séparés par des virgules, sans texte supplémentaire, sans numérotation. Exemple pour Toyota: Corolla, Camry, RAV4, Yaris, Hilux`;

    const modelsToTry = [
      "google/gemini-2.0-flash-001",
      "deepseek/deepseek-chat",
      "mistralai/mistral-7b-instruct",
      "qwen/qwen2.5-coder-32b-instruct",
      "microsoft/phi-3-medium-128k-instruct"
    ];

    let response = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 120
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://karhabti.tn',
            'X-Title': 'Karhabti'
          },
          timeout: 15000
        });

        if (response?.data?.choices?.[0]?.message?.content) break;
      } catch (err) {
        lastError = err;
        await new Promise(r => setTimeout(r, 800));
      }
    }

    if (!response?.data?.choices?.[0]?.message?.content) {
      throw lastError || new Error('Aucun modèle n’a répondu correctement');
    }

    const content = response.data.choices[0].message.content.trim();
    const modeles = content.split(/,\s*/).map(m => m.trim()).filter(Boolean);

    res.status(200).json({ success: true, data: modeles });
  } catch (error) {
    console.error('suggestModels error:', error);
    res.status(503).json({
      success: false,
      message: 'Service de suggestion temporairement indisponible',
      error: error.message
    });
  }
};

const suggestFromImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }

    const file = req.files[0];
    const filePath = file.path;

    if (!fs.existsSync(filePath)) {
      return res.status(500).json({
        success: false,
        message: 'Fichier image introuvable sur le serveur'
      });
    }

    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';

    const prompt = `Tu es un expert en reconnaissance de véhicules.
Analyse cette image UNIQUE et retourne **UNIQUEMENT** un objet JSON valide, sans aucun texte avant/après, sans markdown, sans \`\`\`.
Clés obligatoires :
- marque     : string ("Toyota", "Peugeot", "BMW", "Honda", ..., "Inconnu")
- modele     : string ("208", "Clio", "Civic", "MT-07", ..., "" si inconnu)
- type       : string (pour voiture : "Citadine", "Berline", "SUV / Crossover", "Sportive", "Cabriolet", "Monospace", "Pickup", "Utilitaire / Van" — pour moto : "Routière", "Sportive", "Naked", "Trail/Adventure", "Scooter", "Maxi-scooter", "Cruiser", "Touring")
- couleur    : string ("Noir", "Blanc", "Gris", "Rouge", "Bleu", "Argent", "Vert", ..., "Inconnu")
- confiance  : number entre 0.0 et 1.0
Exemple exact pour une petite voiture bleue :
{"marque":"Peugeot","modele":"208","type":"Citadine","couleur":"Bleu","confiance":0.94}`;

    const visionModels = [
      'google/gemini-2.0-flash-001',
      'openai/gpt-4o-mini',
      'qwen/qwen2.5-vl-72b-instruct',
      'qwen/qwen2.5-vl-32b-instruct'
    ];

    let detected = null;
    let usedModel = null;
    let lastError = null;

    for (const model of visionModels) {
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  {
                    type: 'image_url',
                    image_url: { url: `data:${mimeType};base64,${base64Image}` }
                  }
                ]
              }
            ],
            max_tokens: 350,
            temperature: 0.1,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://karhabti.tn',
              'X-Title': 'Karhabti Vehicule Detection'
            },
            timeout: 60000
          }
        );

        let content = response?.data?.choices?.[0]?.message?.content || '';

        content = content
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .replace(/[\n\r]+/g, ' ')
          .trim();

        if (content.startsWith('{') && content.endsWith('}')) {
          detected = JSON.parse(content);
          usedModel = model;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Vision model ${model} failed: ${err.message}`);
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (!detected) {
      throw lastError || new Error('Aucun modèle vision n’a réussi à analyser l’image');
    }

    detected.confiance = Number(detected.confiance ?? 0.45);
    if (isNaN(detected.confiance) || detected.confiance < 0 || detected.confiance > 1) {
      detected.confiance = 0.45;
    }

    res.status(200).json({
      success: true,
      data: detected,
      debug: { usedModel }
    });
  } catch (error) {
    console.error('suggestFromImage error:', error);
    res.status(500).json({
      success: false,
      message: 'Échec de l’analyse IA de l’image',
      error: error.message
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