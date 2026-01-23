const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Fonction pour générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'votre-secret-super-long-et-complexe-ici',
    { expiresIn: '7d' } // 7 jours – à ajuster selon tes besoins
  );
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/users/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    // Validation express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { nom, prenom, dateNaissance, telephone, email, mdp, role } = req.body;

    // Gestion du rôle – liste blanche + fallback sécurisé
    const validRoles = ['user', 'agent', 'admin'];
    const userRole = role && validRoles.includes(role.trim().toLowerCase())
      ? role.trim().toLowerCase()
      : 'user';   // ← rôle par défaut

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Création de l'utilisateur
    const user = await User.create({
      nom,
      prenom,
      dateNaissance,
      telephone,
      email: email.toLowerCase(),
      mdp,                // ← doit être hashé dans le model (pre-save hook)
      role: userRole
    });

    // Token
    const token = generateToken(user);

    // Réponse réussie
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role        // ← important pour le frontend
      }
    });

  } catch (error) {
    console.error('Erreur inscription :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message   // ← utile en dev, à retirer ou masquer en prod
    });
  }
};

// @desc    Connexion utilisateur
// @route   POST /api/users/signin
// @access  Public
exports.signin = async (req, res) => {
  try {
    const { email, mdp } = req.body;

    if (!email || !mdp) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir email et mot de passe'
      });
    }

    // Récupérer utilisateur + mot de passe
    const user = await User.findOne({ email: email.toLowerCase() }).select('+mdp');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isMatch = await user.comparerMotDePasse(mdp);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur connexion :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: error.message
    });
  }
};

// @desc    Récupérer le profil de l'utilisateur connecté
// @route   GET /api/users/me
// @access  Private (doit passer par middleware auth)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-mdp -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erreur getMe :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};