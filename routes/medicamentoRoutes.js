const express = require('express');
const router = express.Router();
const medicamentoController = require('../controllers/medicamentoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { scopeTenant } = require('../middleware/tenantMiddleware');

router.use(verificarToken);
router.use(scopeTenant);

router.get('/', medicamentoController.listarTodos);
router.get('/:id', medicamentoController.buscarPorId);
router.post('/', verificarRol('administrador', 'moderador'), medicamentoController.crear);
router.put('/:id', verificarRol('administrador', 'moderador'), medicamentoController.actualizar);
router.delete('/:id', verificarRol('administrador'), medicamentoController.eliminar);

module.exports = router;
