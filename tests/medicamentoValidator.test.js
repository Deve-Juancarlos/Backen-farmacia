const { test } = require('node:test');
const assert = require('node:assert/strict');
const { separarCampos, validarMedicamentoCompleto } = require('../validators/medicamentoValidator');
const { validarRegistro } = require('../validators/authValidator');

test('separarCampos: acepta campos editables válidos', () => {
  const { errores, datos } = separarCampos({ descripcionMed: 'Paracetamol', stock: 10, precioVentaUni: 2.5 });
  assert.deepEqual(errores, []);
  assert.deepEqual(datos, { descripcionMed: 'Paracetamol', stock: 10, precioVentaUni: 2.5 });
});

test('separarCampos: rechaza campos prohibidos (PK y tenant)', () => {
  const { errores } = separarCampos({ CodMedicamento: 99, CodTenant: 2 });
  assert.equal(errores.length, 2);
});

test('separarCampos: rechaza campos desconocidos', () => {
  const { errores } = separarCampos({ hack: 'x' });
  assert.equal(errores.length, 1);
});

test('separarCampos: descarta strings vacíos', () => {
  const { errores, datos } = separarCampos({ descripcionMed: 'Paracetamol', fechaVencimiento: '' });
  assert.deepEqual(errores, []);
  assert.deepEqual(datos, { descripcionMed: 'Paracetamol' });
});

test('separarCampos: rechaza cuerpos que no son objetos', () => {
  assert.equal(separarCampos(null).errores.length, 1);
  assert.equal(separarCampos([1]).errores.length, 1);
});

test('validarMedicamentoCompleto: medicamento válido no tiene errores', () => {
  const errores = validarMedicamentoCompleto({
    descripcionMed: 'Paracetamol 500mg',
    stock: 10,
    precioVentaUni: 2.5,
    fechaFabricacion: '2026-01-01',
    fechaVencimiento: '2028-01-01',
    CodLab: 1
  });
  assert.deepEqual(errores, []);
});

test('validarMedicamentoCompleto: rechaza stock negativo', () => {
  const errores = validarMedicamentoCompleto({ descripcionMed: 'Paracetamol', stock: -5, precioVentaUni: 2 });
  assert.ok(errores.some(e => e.includes('stock')));
});

test('validarMedicamentoCompleto: rechaza stock no entero', () => {
  const errores = validarMedicamentoCompleto({ descripcionMed: 'Paracetamol', stock: 1.5, precioVentaUni: 2 });
  assert.ok(errores.some(e => e.includes('stock')));
});

test('validarMedicamentoCompleto: rechaza precio negativo', () => {
  const errores = validarMedicamentoCompleto({ descripcionMed: 'Paracetamol', stock: 1, precioVentaUni: -1 });
  assert.ok(errores.some(e => e.includes('precioVentaUni')));
});

test('validarMedicamentoCompleto: rechaza precio no numérico', () => {
  const errores = validarMedicamentoCompleto({ descripcionMed: 'Paracetamol', stock: 1, precioVentaUni: true });
  assert.ok(errores.some(e => e.includes('precioVentaUni')));
});

test('validarMedicamentoCompleto: rechaza vencimiento anterior a fabricación', () => {
  const errores = validarMedicamentoCompleto({
    descripcionMed: 'Paracetamol',
    stock: 1,
    precioVentaUni: 2,
    fechaFabricacion: '2026-05-01',
    fechaVencimiento: '2025-05-01'
  });
  assert.ok(errores.some(e => e.includes('vencimiento') || e.includes('Vencimiento')));
});

test('validarMedicamentoCompleto: rechaza descripción corta', () => {
  const errores = validarMedicamentoCompleto({ descripcionMed: 'ab', stock: 1, precioVentaUni: 2 });
  assert.ok(errores.some(e => e.includes('descripcionMed')));
});

test('validarMedicamentoCompleto: CodLab debe ser entero positivo', () => {
  const errores = validarMedicamentoCompleto({ descripcionMed: 'Paracetamol', stock: 1, precioVentaUni: 2, CodLab: 0 });
  assert.ok(errores.some(e => e.includes('CodLab')));
});

test('validarRegistro: acepta registro válido', () => {
  const { errores, datos } = validarRegistro({ username: 'juan123', password: 'secreta1' });
  assert.deepEqual(errores, []);
  assert.equal(datos.username, 'juan123');
});

test('validarRegistro: rechaza usuario corto y password corta', () => {
  const { errores } = validarRegistro({ username: 'ab', password: '123' });
  assert.equal(errores.length, 2);
});

test('validarRegistro: valida nombreTenant si se envía', () => {
  const { errores } = validarRegistro({ username: 'juan123', password: 'secreta1', nombreTenant: 'x' });
  assert.equal(errores.length, 1);
});

test('validarRegistro: acepta rol usuario y moderador', () => {
  assert.equal(validarRegistro({ username: 'juan123', password: 'secreta1', rol: 'usuario' }).datos.rol, 'usuario');
  assert.equal(validarRegistro({ username: 'marta456', password: 'secreta1', rol: 'moderador' }).datos.rol, 'moderador');
});

test('validarRegistro: rechaza rol administrador desde el body', () => {
  const { errores } = validarRegistro({ username: 'juan123', password: 'secreta1', rol: 'administrador' });
  assert.equal(errores.length, 1);
  assert.ok(errores[0].includes('rol'));
});

test('validarRegistro: sin rol queda como usuario', () => {
  assert.equal(validarRegistro({ username: 'juan123', password: 'secreta1' }).datos.rol, 'usuario');
});
