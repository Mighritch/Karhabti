const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Récupérer le token
      token = req.headers.authorization.split(' ')[1];

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-super-long-et-complexe-ici');

      // Récupérer l'utilisateur
      req.user = await User.findById(decoded.id).select('-mdp');

      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Non autorisé - token invalide' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé - aucun token fourni' });
  }
};