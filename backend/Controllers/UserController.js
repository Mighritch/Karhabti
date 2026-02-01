// controllers/UserController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'votre-secret-super-long-et-complexe-ici',
    { expiresIn: '7d' }
  );
};

exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nom, prenom, dateNaissance, telephone, email, mdp, role } = req.body;

    const validRoles = ['user', 'agent', 'admin'];
    const userRole = role && validRoles.includes(role.trim().toLowerCase())
      ? role.trim().toLowerCase()
      : 'user';

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const user = await User.create({
      nom,
      prenom,
      dateNaissance,
      telephone,
      email: email.toLowerCase(),
      mdp,
      role: userRole
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
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
    console.error('Erreur inscription :', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'inscription",
      error: error.message
    });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, mdp } = req.body;

    if (!email || !mdp) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+mdp');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const isMatch = await user.comparerMotDePasse(mdp);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
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
    console.error('Erreur signin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      user: req.user
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

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé avec cet email"
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message =
      `Bonjour ${user.prenom || user.nom || 'utilisateur'},\n\n` +
      `Vous avez demandé une réinitialisation de mot de passe sur Karhabti.\n\n` +
      `Cliquez sur le lien suivant pour créer un nouveau mot de passe :\n` +
      `${resetUrl}\n\n` +
      `Ce lien expirera dans 10 minutes.\n\n` +
      `Si vous n'avez pas fait cette demande, ignorez simplement cet email.\n\n` +
      `Cordialement,\nL'équipe Karhabti`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Réinitialisation de mot de passe - Karhabti',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Email de réinitialisation envoyé avec succès. Vérifiez votre boîte mail (et dossier spam).'
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Erreur envoi email Brevo :', err);
      return res.status(500).json({
        success: false,
        message: "Impossible d'envoyer l'email pour le moment. Réessayez plus tard."
      });
    }
  } catch (error) {
    console.error('Erreur forgotPassword :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token invalide ou expiré"
      });
    }

    user.mdp = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Mot de passe mis à jour avec succès"
    });
  } catch (error) {
    console.error('Erreur resetPassword :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.directReset = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et nouveau mot de passe requis'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Optionnel : tu peux ajouter une vérification (ex: IP, rate-limit, ancien mot de passe, etc.) en prod
    user.mdp = password;          // ← le middleware pre('save') va hasher automatiquement
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur directReset :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la réinitialisation directe'
    });
  }
};