const express = require('express');
const router = express.Router();
const medicamentoController = require('../controllers/medicamentoController');
const { verificarToken } = require('../middleware/authMiddleware');

router.use(verificarToken); // Proteger todas las rutas

router.post('/', medicamentoController.crear);
router.get('/', medicamentoController.listarTodos);
router.get('/:id', medicamentoController.buscarPorId);
router.put('/:id', medicamentoController.actualizar);
router.delete('/:id', medicamentoController.eliminar);

module.exports = router;