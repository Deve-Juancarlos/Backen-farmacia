const CAMPOS_EDITABLES = [
  'descripcionMed',
  'fechaFabricacion',
  'fechaVencimiento',
  'Presentacion',
  'stock',
  'precioVentaUni',
  'precioVentaPres',
  'Marca',
  'CodLab'
];

const CAMPOS_PROHIBIDOS = ['CodMedicamento', 'CodTenant'];

function esNumero(v) {
  return (typeof v === 'number' || typeof v === 'string') &&
    v !== '' &&
    !Number.isNaN(Number(v)) &&
    typeof v !== 'boolean';
}

function fechaValida(v) {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? false : d;
}

function aEntero(v) {
  if (typeof v === 'boolean' || v === null || v === undefined || v === '') return NaN;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
}

// Valida un medicamento completo (ya mergeado con los datos existentes).
// Devuelve un arreglo de mensajes de error.
function validarMedicamentoCompleto(med) {
  const errores = [];

  if (typeof med.descripcionMed !== 'string' ||
      med.descripcionMed.trim().length < 3 ||
      med.descripcionMed.trim().length > 150) {
    errores.push('descripcionMed debe ser un texto de 3 a 150 caracteres');
  }

  if (med.stock === null || med.stock === undefined || med.stock === '' ||
      !Number.isInteger(aEntero(med.stock)) || Number(med.stock) < 0) {
    errores.push('stock debe ser un entero mayor o igual a 0');
  }

  if (med.precioVentaUni === null || med.precioVentaUni === undefined ||
      !esNumero(med.precioVentaUni) || Number(med.precioVentaUni) < 0) {
    errores.push('precioVentaUni debe ser un número mayor o igual a 0');
  }

  if (med.precioVentaPres !== null && med.precioVentaPres !== undefined && med.precioVentaPres !== '' &&
      (!esNumero(med.precioVentaPres) || Number(med.precioVentaPres) < 0)) {
    errores.push('precioVentaPres debe ser un número mayor o igual a 0');
  }

  if (med.CodLab !== null && med.CodLab !== undefined && med.CodLab !== '' &&
      (!Number.isInteger(aEntero(med.CodLab)) || Number(med.CodLab) <= 0)) {
    errores.push('CodLab debe ser un entero positivo');
  }

  const fab = fechaValida(med.fechaFabricacion);
  if (fab === false) errores.push('fechaFabricacion no es una fecha válida');

  const venc = fechaValida(med.fechaVencimiento);
  if (venc === false) errores.push('fechaVencimiento no es una fecha válida');

  if (fab && venc && venc < fab) {
    errores.push('fechaVencimiento debe ser posterior a fechaFabricacion');
  }

  if (med.Presentacion !== null && med.Presentacion !== undefined &&
      (typeof med.Presentacion !== 'string' || med.Presentacion.length > 50)) {
    errores.push('Presentacion debe ser un texto de máximo 50 caracteres');
  }

  if (med.Marca !== null && med.Marca !== undefined &&
      (typeof med.Marca !== 'string' || med.Marca.length > 50)) {
    errores.push('Marca debe ser un texto de máximo 50 caracteres');
  }

  return errores;
}

// Separa del body los campos editables válidos.
// - Campos desconocidos o prohibidos → error.
// - Strings vacíos → se descartan (tratados como "sin valor").
function separarCampos(body) {
  const errores = [];
  const datos = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errores: ['El cuerpo de la petición debe ser un objeto JSON'], datos };
  }

  for (const [clave, valor] of Object.entries(body)) {
    if (CAMPOS_PROHIBIDOS.includes(clave)) {
      errores.push(`El campo "${clave}" no puede enviarse: se asigna automáticamente`);
      continue;
    }
    if (!CAMPOS_EDITABLES.includes(clave)) {
      errores.push(`Campo no permitido: "${clave}"`);
      continue;
    }
    if (valor === '' || valor === undefined) continue;
    datos[clave] = valor;
  }

  return { errores, datos };
}

module.exports = {
  CAMPOS_EDITABLES,
  CAMPOS_PROHIBIDOS,
  validarMedicamentoCompleto,
  separarCampos
};
