const { Medicamento, Laboratorio } = require('../models');

// CREATE - Crear medicamento
exports.crear = async (req, res) => {
  try {
    const nuevoMedicamento = await Medicamento.create(req.body);
    res.status(201).json({ mensaje: 'Medicamento creado', data: nuevoMedicamento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ ALL - Listar todos
exports.listarTodos = async (req, res) => {
  try {
    const medicamentos = await Medicamento.findAll({
      include: [{ model: Laboratorio, attributes: ['razonSocial'] }]
    });
    res.json(medicamentos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ ONE - Buscar por ID
exports.buscarPorId = async (req, res) => {
  try {
    const medicamento = await Medicamento.findByPk(req.params.id, {
      include: [{ model: Laboratorio }]
    });
    if (!medicamento) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }
    res.json(medicamento);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE - Actualizar
exports.actualizar = async (req, res) => {
  try {
    const [actualizado] = await Medicamento.update(req.body, {
      where: { CodMedicamento: req.params.id }
    });
    if (actualizado) {
      const medicamento = await Medicamento.findByPk(req.params.id);
      res.json({ mensaje: 'Medicamento actualizado', data: medicamento });
    } else {
      res.status(404).json({ error: 'Medicamento no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE - Eliminar
exports.eliminar = async (req, res) => {
  try {
    const eliminado = await Medicamento.destroy({
      where: { CodMedicamento: req.params.id }
    });
    if (eliminado) {
      res.json({ mensaje: 'Medicamento eliminado' });
    } else {
      res.status(404).json({ error: 'Medicamento no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};