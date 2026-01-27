// middleware/agence.js
const Agence = require('../models/Agence');
const asyncHandler = require('express-async-handler');

/**
 * Middleware qui vérifie :
 * 1. Que l'utilisateur est un agent (role = 'agent')
 * 2. Qu'il possède bien une agence
 * 3. Que cette agence est approuvée (status = 'approved')
 * 
 * Si tout est OK → attache l'agence trouvée à req.agence
 */
const requireApprovedAgency = asyncHandler(async (req, res, next) => {
  // 1. Vérification du rôle (agent OU admin)
  if (req.user?.role !== 'agent' && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux agents et administrateurs'
    });
  }

  // 2. Récupération de l'ID de l'agence
  const agenceId = req.body.agence || req.query.agenceId;
  let agence;

  if (req.user.role === 'admin') {
    // Si admin, il peut voir n'importe quelle agence s'il fournit un ID
    if (agenceId) {
      agence = await Agence.findById(agenceId);
    } else {
      // Si pas d'ID, on ne peut pas deviner quelle agence il veut
      return res.status(400).json({
        success: false,
        message: "ID d'agence requis pour les administrateurs"
      });
    }
  } else {
    // Si agent, on vérifie que l'agence lui appartient
    if (agenceId) {
      agence = await Agence.findOne({ _id: agenceId, agent: req.user._id });
    } else {
      agence = await Agence.findOne({ agent: req.user._id });
    }
  }

  // 3. Vérification de l'existence
  if (!agence) {
    return res.status(404).json({
      success: false,
      message: "Agence non trouvée ou accès non autorisé"
    });
  }

  // 4. Vérification du statut (seulement pour les fonctionnalités qui le nécessitent)
  // On laisse passer l'admin même si c'est pas approved pour qu'il puisse voir/gérer
  if (req.user.role !== 'admin' && agence.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: `Votre agence est ${agence.status}. Vous ne pouvez pas encore effectuer cette action.`
    });
  }

  // Tout est OK
  req.agence = agence;
  next();
});

module.exports = {
  requireApprovedAgency
};