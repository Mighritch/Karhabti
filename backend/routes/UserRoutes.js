const express = require('express');
const router = express.Router();
const { 
  signup, 
  signin, 
  getMe,
  forgotPassword,
  resetPassword,
  directReset
} = require('../Controllers/UserController');

const { protect } = require('../middleware/auth');           // middleware JWT

// Routes publiques
router.post('/signup', signup);
router.post('/signin',  signin);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/direct-reset', directReset);

// Routes protégées
router.get('/me', protect, getMe);

module.exports = router;