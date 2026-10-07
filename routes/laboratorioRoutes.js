const express = require('express');
const router = express.Router();
const laboratorioController = require('../controllers/laboratorioController');
const { verificarToken } = require('../middleware/authMiddleware');

router.use(verificarToken);

router.get('/', laboratorioController.listarTodos);

module.exports = router;
