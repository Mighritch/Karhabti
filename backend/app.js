// app.js
// ────────────────────────────────────────────────
//  Ordre important : dotenv en TOUT PREMIER
// ────────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const cors = require('cors');

const connectDB = require('./config/db');

// Import des routeurs
const indexRouter    = require('./routes/index');
const userRoutes     = require('./routes/UserRoutes');
const agenceRoutes   = require('./routes/AgenceRoutes');
const vehiculeRoutes = require('./routes/VehiculeRoutes');

const app = express();

// Connexion MongoDB
connectDB();

// Configuration CORS – très important pour le frontend
app.use(cors({
  origin: 'http://localhost:5173',           // ← ton frontend (Vite / React / etc.)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// View engine (optionnel – à conserver seulement si tu rends des vues Twig côté serveur)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

// Middlewares de base
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// Optionnel : servir tout le dossier public (images, css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/',               indexRouter);
app.use('/api/users',      userRoutes);
app.use('/api/agences',    agenceRoutes);
app.use('/api/vehicules',  vehiculeRoutes);

// Catch 404 et forward vers le gestionnaire d'erreur
app.use((req, res, next) => {
  next(createError(404));
});

// Gestionnaire d’erreurs centralisé
app.use((err, req, res, next) => {
  // Variables pour les templates (si vues Twig utilisées)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Statut HTTP
  res.status(err.status || 500);

  // Réponse adaptée selon le type de requête
  if (req.originalUrl.startsWith('/api/')) {
    // Réponse JSON pour les routes API (ce que tu veux presque toujours)
    res.json({
      success: false,
      message: err.message || 'Erreur serveur interne',
      ...(req.app.get('env') === 'development' && { stack: err.stack })
    });
  } else {
    // Réponse HTML pour les autres routes (si tu utilises des vues)
    res.render('error');
  }
});

module.exports = app;