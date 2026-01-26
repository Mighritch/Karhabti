// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler'); // ← recommandé (optionnel mais très utile)

/**
 * Middleware de protection des routes
 * Vérifie la présence et la validité d'un JWT Bearer token
 * Attache l'utilisateur authentifié à req.user (sans le champ mot de passe)
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Récupération du token depuis l'en-tête Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extrait le token après "Bearer "
      token = req.headers.authorization.split(' ')[1];

      // Vérification & décodage du JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'votre-secret-super-long-et-complexe-ici-pour-dev'
      );

      // Récupération de l'utilisateur (exclut le champ mot de passe)
      // → adaptez '-mdp' si votre champ s'appelle 'password', 'hash', etc.
      req.user = await User
        .findById(decoded.id)
        .select('-mdp -__v');           // on enlève aussi __v par défaut

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Optionnel : vous pouvez ajouter des vérifications supplémentaires ici
      // ex: if (!req.user.isActive) → compte désactivé / banni

      next();
    } catch (error) {
      console.error('Erreur middleware protect :', error.message);

      let message = 'Non autorisé - token invalide';

      if (error.name === 'TokenExpiredError') {
        message = 'Non autorisé - token expiré';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Non autorisé - token malformé';
      }

      return res.status(401).json({
        success: false,
        message,
        // error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 2. Pas de token du tout
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - aucun token fourni'
    });
  }
});

// Variante optionnelle : middleware qui autorise seulement certains rôles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès interdit. Rôles autorisés : ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,           // bonus : très utile avec protect
  // Vous pouvez ajouter d'autres middlewares d'auth plus tard
  // ex: optionalAuth, refreshToken, etc.
};