require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const cors = require('cors');

const connectDB = require('./config/db');

const indexRouter = require('./routes/index');
const userRoutes = require('./routes/UserRoutes');
const agenceRoutes = require('./routes/AgenceRoutes');

const app = express();

// Connexion MongoDB
connectDB();

// Configuration CORS – IMPORTANT : ne PAS utiliser * avec credentials
app.use(cors({
  origin: 'http://localhost:5173',          // ← ton port Vite / frontend réel (très souvent 5173)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Gère les requêtes OPTIONS (preflight) automatiquement grâce à cors ci-dessus
// (plus besoin de app.options('*', cors()) si tu utilises la config ci-dessus)

// view engine (supprime si tu n'utilises pas de vues twig côté serveur)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/api/users', userRoutes);
app.use('/api/agences', agenceRoutes);

// 404
app.use((req, res, next) => {
  next(createError(404));
});

// Gestionnaire d'erreurs
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);

  if (req.originalUrl.startsWith('/api/')) {
    res.json({
      success: false,
      message: err.message || 'Erreur serveur',
      ...(req.app.get('env') === 'development' && { stack: err.stack })
    });
  } else {
    res.render('error');
  }
});

module.exports = app;