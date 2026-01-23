var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Accueil' });
});

/* GET signin page. */
router.get('/signin', function(req, res, next) {
  res.render('signin', { title: 'Connexion' });
});

/* GET signup page. */
router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Inscription' });
});

module.exports = router;
