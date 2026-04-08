const Voiture = require('../models/Voiture');
const Moto = require('../models/Moto');
const Panier = require('../models/Panier');
const Commande = require('../models/Commande');
const Agence = require('../models/Agence');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const timeoutPromise = (ms, msg = 'Timeout') =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));

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

const deleteVoiture = async (req, res) => {
  try {
    const voiture = await Voiture.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!voiture) return res.status(404).json({ success: false });

    voiture.images.forEach(img => {
      const filePath = path.join(__dirname, '..', 'public', img.url.replace('/uploads/vehicules/', 'uploads/vehicules/'));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await voiture.deleteOne();
    res.json({ success: true, message: 'Voiture supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyVoitures = async (req, res) => {
  try {
    const voitures = await Voiture.find({ agence: req.agence._id });
    res.json({ success: true, data: voitures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

const deleteMoto = async (req, res) => {
  try {
    const moto = await Moto.findOne({ _id: req.params.id, agence: req.agence._id });
    if (!moto) return res.status(404).json({ success: false });

    moto.images.forEach(img => {
      const filePath = path.join(__dirname, '..', 'public', img.url.replace('/uploads/vehicules/', 'uploads/vehicules/'));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await moto.deleteOne();
    res.json({ success: true, message: 'Moto supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyMotos = async (req, res) => {
  try {
    const motos = await Moto.find({ agence: req.agence._id });
    res.json({ success: true, data: motos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getGlobalStats = async (req, res) => {
  try {
    const totalVoitures = await Voiture.countDocuments();
    const totalMotos = await Moto.countDocuments();
    res.json({
      success: true,
      data: { totalVoitures, totalMotos, totalVehicules: totalVoitures + totalMotos }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const searchVehicles = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query?.trim()) return res.status(400).json({ success: false, message: 'Query requise' });

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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

    const voitures = fetchVoitures ? await Voiture.find({ etat: 'neuf' }).populate(agencePopulate) : [];
    const motos = fetchMotos ? await Moto.find({ etat: 'neuf' }).populate(agencePopulate) : [];

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

    const voitures = fetchVoitures ? await Voiture.find({ etat: 'occasion' }).populate(agencePopulate) : [];
    const motos = fetchMotos ? await Moto.find({ etat: 'occasion' }).populate(agencePopulate) : [];

    res.json({
      success: true,
      voitures: voitures.filter(v => v.agence),
      motos: motos.filter(m => m.agence)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `Tu es un expert en identification de véhicules...`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: imageFile.mimetype || 'image/jpeg'
      }
    };

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
    };

    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    res.json({ success: true, data });
  } catch (err) {
    if (imagePath && fs.existsSync(imagePath)) {
      try { fs.unlinkSync(imagePath); } catch (e) {}
    }
    res.json({ success: true, data: { marque: 'Inconnu', modele: 'Inconnu', confiance: 0 } });
  }
};

const addToCart = async (req, res) => {
  try {
    const { vehiculeId, typeVehicule } = req.body;
    const userId = req.user._id;

    if (!vehiculeId || !typeVehicule) {
      return res.status(400).json({ success: false, message: 'vehiculeId et typeVehicule requis' });
    }

    let vehicule;
    if (typeVehicule === 'voiture') {
      vehicule = await Voiture.findById(vehiculeId).populate('agence', 'nom status');
    } else if (typeVehicule === 'moto') {
      vehicule = await Moto.findById(vehiculeId).populate('agence', 'nom status');
    } else {
      return res.status(400).json({ success: false, message: 'Type de véhicule invalide' });
    }

    if (!vehicule) return res.status(404).json({ success: false, message: 'Véhicule non trouvé' });
    if (vehicule.agence?.status !== 'approved') {
      return res.status(403).json({ success: false, message: "L'agence n'est pas approuvée" });
    }

    let panier = await Panier.findOne({ user: userId });
    if (!panier) panier = new Panier({ user: userId, items: [] });

    const itemExists = panier.items.some(item => item.vehiculeId.toString() === vehiculeId);
    if (itemExists) {
      return res.status(400).json({ success: false, message: 'Ce véhicule est déjà dans votre panier' });
    }

    panier.items.push({
      vehiculeId: vehicule._id,
      typeVehicule: typeVehicule === 'voiture' ? 'Voiture' : 'Moto',
      marque: vehicule.marque,
      modele: vehicule.modele,
      annee: vehicule.annee,
      prix: vehicule.prix,
      imageUrl: vehicule.images?.[0]?.url || null,
      agenceNom: vehicule.agence?.nom || 'Agence inconnue',
      etat: vehicule.etat
    });

    await panier.save();

    res.json({
      success: true,
      message: 'Véhicule ajouté au panier avec succès',
      item: { vehiculeId: vehicule._id, marque: vehicule.marque, modele: vehicule.modele, prix: vehicule.prix }
    });
  } catch (err) {
    console.error('Erreur addToCart:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const panier = await Panier.findOne({ user: userId });

    if (!panier) return res.json({ success: true, items: [], total: 0 });

    const items = panier.items.map(i => ({
      ...i._doc,
      typeVehicule: i.typeVehicule === 'Voiture' ? 'voiture' : 'moto'
    }));

    const total = items.reduce((sum, i) => sum + (i.prix || 0), 0);

    res.json({ success: true, items, total });
  } catch (err) {
    console.error('Erreur getCart:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    if (!itemId) {
      return res.status(400).json({ success: false, message: 'itemId requis' });
    }

    const result = await Panier.updateOne(
      { user: userId },
      { $pull: { items: { _id: itemId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Article non trouvé dans le panier' });
    }

    res.json({ success: true, message: 'Véhicule retiré du panier avec succès' });
  } catch (err) {
    console.error('Erreur removeFromCart:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    await Panier.updateOne({ user: userId }, { $set: { items: [] } });
    res.json({ success: true, message: 'Panier vidé avec succès' });
  } catch (err) {
    console.error('Erreur clearCart:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const passerCommande = async (req, res) => {
  try {
    const { items, informationsClient, methodePaiement } = req.body;
    const userId = req.user._id;
    const io = req.app.get('io');

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun véhicule sélectionné' });
    }

    const commandeItems = [];
    for (const item of items) {
      const VehiculeModel = item.typeVehicule === 'voiture' ? Voiture : Moto;
      const vehicule = await VehiculeModel.findById(item.vehiculeId).populate('agence');

      if (!vehicule) {
        return res.status(404).json({ success: false, message: `Véhicule ${item.vehiculeId} non trouvé` });
      }

      if (vehicule.agence?.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: `L'agence "${vehicule.agence?.nom || 'inconnue'}" n'est pas approuvée`
        });
      }

      commandeItems.push({
        vehiculeId: vehicule._id,
        typeVehicule: item.typeVehicule,
        marque: vehicule.marque,
        modele: vehicule.modele,
        annee: vehicule.annee,
        prix: vehicule.prix || 0,
        etat: vehicule.etat,
        agenceNom: vehicule.agence?.nom || 'Agence inconnue',
        agenceId: vehicule.agence?._id,
        agentId: vehicule.agence?.agent
      });
    }

    const totalAmount = commandeItems.reduce((sum, item) => sum + (item.prix || 0), 0);
    const numeroCommande = `CMD-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const commande = await Commande.create({
      user: userId,
      numeroCommande,
      items: commandeItems,
      total: totalAmount,
      statut: methodePaiement === 'carte' ? 'en_attente_paiement' : 'en_attente',
      informationsClient,
      methodePaiement,
      dateCommande: new Date()
    });

    commandeItems.forEach(item => {
      if (item.agentId) {
        io.to(`user:${item.agentId}`).emit('notification', {
          type: 'nouvelle_commande',
          commandeId: commande._id,
          numeroCommande: commande.numeroCommande,
          total: commande.total,
          client: {
            nom: `${informationsClient.prenom} ${informationsClient.nom}`,
            telephone: informationsClient.telephone,
            email: informationsClient.email
          },
          items: commandeItems.filter(ci => ci.agentId.toString() === item.agentId.toString()).map(i => ({
            marque: i.marque,
            modele: i.modele,
            prix: i.prix,
            etat: i.etat
          })),
          message: `Nouvelle commande #${commande.numeroCommande}`,
          date: new Date()
        });
      }
    });

    if (methodePaiement === 'carte') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: 'eur',
        metadata: {
          commandeId: commande._id.toString(),
          numeroCommande,
          userId: userId.toString()
        },
        receipt_email: informationsClient.email
      });

      return res.status(200).json({
        success: true,
        message: 'Intention de paiement créée',
        clientSecret: paymentIntent.client_secret,
        commande: {
          numeroCommande: commande.numeroCommande,
          total: commande.total,
          methodePaiement: 'carte',
          commandeId: commande._id
        }
      });
    }

    await Panier.updateOne({ user: userId }, { $set: { items: [] } });

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      commande
    });

  } catch (err) {
    console.error('Erreur passerCommande:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const confirmerPaiement = async (req, res) => {
  try {
    const { paymentIntentId, commandeId } = req.body;
    const userId = req.user._id;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Le paiement n\'a pas été confirmé'
      });
    }

    const commande = await Commande.findOne({ _id: commandeId, user: userId });
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    commande.statut = 'payee';
    commande.paymentIntentId = paymentIntentId;
    await commande.save();

    await Panier.updateOne({ user: userId }, { $set: { items: [] } });

    res.json({
      success: true,
      message: 'Paiement confirmé avec succès',
      commande: {
        numeroCommande: commande.numeroCommande,
        statut: commande.statut
      }
    });
  } catch (err) {
    console.error('Erreur confirmerPaiement:', err);
    res.status(500).json({ success: false, message: err.message });
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
  getGlobalStats,
  searchVehicles,
  getAllNeufsAVendre,
  getAllOccasionsAVendre,
  suggestModels,
  suggestFromImage,
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  passerCommande,
  confirmerPaiement
};