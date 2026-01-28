require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const cors = require('cors');

const connectDB = require('./config/db');

// Import des routeurs
const indexRouter = require('./routes/index');
const userRoutes = require('./routes/UserRoutes');
const agenceRoutes = require('./routes/AgenceRoutes');
const vehiculeRoutes = require('./routes/VehiculeRoutes');   // ← NOUVEAU

const app = express();

// Connexion MongoDB
connectDB();

// Configuration CORS – IMPORTANT : adapter selon ton frontend
app.use(cors({
  origin: 'http://localhost:5173',          // ← ton frontend (Vite/React/Angular/etc.)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// View engine (optionnel – à supprimer si tu n’utilises pas de vues serveur)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// ou plus simplement (si déjà public est servi) :
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/api/users', userRoutes);
app.use('/api/agences', agenceRoutes);
app.use('/api/vehicules', vehiculeRoutes);          // ← AJOUTÉ ICI

// Catch 404 et forward vers gestionnaire d'erreur
app.use((req, res, next) => {
  next(createError(404));
});

// Gestionnaire d'erreurs centralisé
app.use((err, req, res, next) => {
  // Définir les variables locales pour les templates (si tu utilises des vues)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Définir le statut
  res.status(err.status || 500);

  // Réponse JSON pour les routes API
  if (req.originalUrl.startsWith('/api/')) {
    res.json({
      success: false,
      message: err.message || 'Erreur serveur interne',
      ...(req.app.get('env') === 'development' && { stack: err.stack })
    });
  } else {
    res.render('error');
  }
});

module.exports = app;
