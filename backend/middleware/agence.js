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
  // 1. Vérification du rôle
  if (req.user?.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux agents'
    });
  }

  // 2. Recherche de l'agence
  // On essaye de récupérer l'ID de l'agence depuis le corps de la requête (cas de l'ajout de véhicule)
  const agenceId = req.body.agence || req.query.agenceId;
  let agence;

  if (agenceId) {
    // Si un ID est fourni, on vérifie que cette agence appartient bien à l'agent
    agence = await Agence.findOne({ _id: agenceId, agent: req.user._id });
  } else {
    // Sinon on prend la première agence trouvée pour cet agent
    agence = await Agence.findOne({ agent: req.user._id });
  }

  // 3. L'utilisateur n'a pas encore créé d'agence ou l'ID est invalide
  if (!agence) {
    return res.status(403).json({
      success: false,
      message: agenceId
        ? "Agence non trouvée ou vous n'en êtes pas le propriétaire."
        : "Vous n'avez pas encore créé d'agence."
    });
  }

  // 4. Vérification du statut de l'agence
  if (agence.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: `Votre agence est ${agence.status}. Vous ne pouvez pas encore ajouter de véhicules.`
    });
  }

  // Tout est OK → on attache l'agence à la requête
  req.agence = agence;
  next();
});

module.exports = {
  requireApprovedAgency
};