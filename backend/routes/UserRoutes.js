const express = require('express');
const router = express.Router();

const { 
  signup, 
  signin, 
  getMe,
  forgotPassword,
  resetPassword,
  directReset 
} = require('../controllers/UserController');   // ← attention au chemin et casse !

const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/signin', signin);                 // ← doit être exactement /signin
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/direct-reset', directReset);

router.get('/me', protect, getMe);

module.exports = router;