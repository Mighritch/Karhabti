const express = require('express');
const router = express.Router();
const { 
  signup, 
  signin, 
  getMe 
} = require('../Controllers/UserController');

const { protect } = require('../middleware/auth');           // middleware JWT

// Routes publiques
router.post('/signup', signup);
router.post('/signin',  signin);

// Routes protégées
router.get('/me', protect, getMe);

module.exports = router;