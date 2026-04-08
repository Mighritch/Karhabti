// app.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');

// Import des routeurs
const indexRouter = require('./routes/index');
const userRoutes = require('./routes/UserRoutes');
const agenceRoutes = require('./routes/AgenceRoutes');
const vehiculeRoutes = require('./routes/VehiculeRoutes');

const app = express();
const server = http.createServer(app);

// Configuration Socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attacher io à l'app
app.set('io', io);

// Connexion MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/api/users', userRoutes);
app.use('/api/agences', agenceRoutes);
app.use('/api/vehicules', vehiculeRoutes);

// Socket.io
io.on('connection', (socket) => {
  console.log('Utilisateur connecté via socket:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`Utilisateur ${userId} a rejoint la room user:${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });
});

// Catch 404
app.use((req, res, next) => {
  next(createError(404));
});

// Gestionnaire d’erreurs
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  if (req.originalUrl.startsWith('/api/')) {
    res.json({
      success: false,
      message: err.message || 'Erreur serveur interne',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    res.render('error');
  }
});

// Démarrage du serveur avec gestion du port déjà utilisé
const PORT = process.env.PORT || 5000;

const startServer = (port) => {
  server.listen(port, () => {
    console.log(`🚀 Serveur démarré avec succès sur le port ${port}`);
    console.log(`📡 Socket.io est prêt pour les notifications en temps réel`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Le port ${port} est déjà utilisé.`);
      console.log(`🔄 Tentative sur le port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Erreur serveur:', err);
    }
  });
};

startServer(PORT);

module.exports = app;