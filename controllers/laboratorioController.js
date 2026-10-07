const { Laboratorio } = require('../models');

// Listado de laboratorios (catálogo compartido entre farmacias).
exports.listarTodos = async (req, res) => {
  try {
    const laboratorios = await Laboratorio.findAll({
      attributes: ['CodLab', 'razonSocial'],
      order: [['razonSocial', 'ASC']]
    });
    res.json(laboratorios);
  } catch (error) {
    console.error('[laboratorios]', error);
    res.status(500).json({ error: 'Error interno al listar los laboratorios' });
  }
};
