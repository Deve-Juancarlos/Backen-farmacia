const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { limitarLogin } = require('../middleware/rateLimit');

router.post('/registro', authController.registrar);
router.post('/login', limitarLogin(), authController.login);

module.exports = router;
