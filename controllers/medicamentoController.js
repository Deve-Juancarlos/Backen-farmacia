const { Medicamento, Laboratorio } = require('../models');
const { separarCampos, validarMedicamentoCompleto } = require('../validators/medicamentoValidator');

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'El id debe ser un número entero positivo' });
    return null;
  }
  return id;
}

function responderError(res, error, contexto) {
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: 'El laboratorio indicado no existe' });
  }
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: error.errors.map(e => e.message)
    });
  }
  console.error(`[${contexto}]`, error);
  return res.status(500).json({ error: `Error interno al ${contexto} el medicamento` });
}

// CREATE - Crear medicamento (solo administrador/moderador, tenant del JWT)
exports.crear = async (req, res) => {
  const { errores, datos } = separarCampos(req.body);
  if (errores.length) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  }

  const paraValidar = { stock: 0, ...datos };
  const erroresValidacion = validarMedicamentoCompleto(paraValidar);
  if (erroresValidacion.length) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: erroresValidacion });
  }

  try {
    const nuevoMedicamento = await Medicamento.create({ ...datos, CodTenant: req.tenantId });
    res.status(201).json({ mensaje: 'Medicamento creado', data: nuevoMedicamento });
  } catch (error) {
    responderError(res, error, 'crear');
  }
};

// READ ALL - Listar solo los medicamentos del tenant
exports.listarTodos = async (req, res) => {
  try {
    const medicamentos = await Medicamento.findAll({
      where: { CodTenant: req.tenantId },
      include: [{ model: Laboratorio, attributes: ['razonSocial'] }],
      order: [['CodMedicamento', 'ASC']]
    });
    res.json(medicamentos);
  } catch (error) {
    console.error('[listar]', error);
    res.status(500).json({ error: 'Error interno al listar los medicamentos' });
  }
};

// READ ONE - Buscar por ID dentro del tenant
exports.buscarPorId = async (req, res) => {
  const id = parseId(req, res);
  if (!id) return;

  try {
    const medicamento = await Medicamento.findOne({
      where: { CodMedicamento: id, CodTenant: req.tenantId },
      include: [{ model: Laboratorio }]
    });
    if (!medicamento) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }
    res.json(medicamento);
  } catch (error) {
    console.error('[buscar]', error);
    res.status(500).json({ error: 'Error interno al buscar el medicamento' });
  }
};

// UPDATE - Actualizar (incluye stock). Solo campos editables y del tenant.
exports.actualizar = async (req, res) => {
  const id = parseId(req, res);
  if (!id) return;

  const { errores, datos } = separarCampos(req.body);
  if (errores.length) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  }
  if (Object.keys(datos).length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  }

  try {
    const existente = await Medicamento.findOne({
      where: { CodMedicamento: id, CodTenant: req.tenantId }
    });
    if (!existente) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }

    const combinado = { ...existente.toJSON(), ...datos };
    const erroresValidacion = validarMedicamentoCompleto(combinado);
    if (erroresValidacion.length) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: erroresValidacion });
    }

    await Medicamento.update(datos, {
      where: { CodMedicamento: id, CodTenant: req.tenantId }
    });

    const medicamento = await Medicamento.findOne({
      where: { CodMedicamento: id, CodTenant: req.tenantId },
      include: [{ model: Laboratorio }]
    });
    res.json({ mensaje: 'Medicamento actualizado', data: medicamento });
  } catch (error) {
    responderError(res, error, 'actualizar');
  }
};

// DELETE - Eliminar (solo administrador, solo del tenant)
exports.eliminar = async (req, res) => {
  const id = parseId(req, res);
  if (!id) return;

  try {
    const existente = await Medicamento.findOne({
      where: { CodMedicamento: id, CodTenant: req.tenantId }
    });
    if (!existente) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }

    await Medicamento.destroy({
      where: { CodMedicamento: id, CodTenant: req.tenantId }
    });
    res.json({ mensaje: 'Medicamento eliminado' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ error: 'No se puede eliminar: el medicamento tiene registros relacionados' });
    }
    console.error('[eliminar]', error);
    res.status(500).json({ error: 'Error interno al eliminar el medicamento' });
  }
};
