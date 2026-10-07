const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciarServidor } = require('./helpers/servidor');

let api, registrar, login, detener;
const t = {};

const crearMed = (token, extra = {}) => api('POST', '/api/medicamentos', {
  token,
  body: { descripcionMed: 'Paracetamol 500mg', stock: 10, precioVentaUni: 2.5, CodLab: t.labId, ...extra }
});

const primerId = async (token) => {
  const lista = await api('GET', '/api/medicamentos', { token });
  return lista.body[0].CodMedicamento;
};

before(async () => {
  ({ api, registrar, login, detener, Lab, base: t.base } = await iniciarServidor());

  await registrar({ username: 'adminA', password: 'secret1', nombreTenant: 'Farmacia A' });
  await registrar({ username: 'adminB', password: 'secret1', nombreTenant: 'Farmacia B' });
  await registrar({ username: 'juan', password: 'secret1', rol: 'usuario' });
  await registrar({ username: 'marta', password: 'secret1', rol: 'moderador' });

  t.adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  t.adminB = (await login({ username: 'adminB', password: 'secret1' })).body;
  t.juan = (await login({ username: 'juan', password: 'secret1' })).body;
  t.marta = (await login({ username: 'marta', password: 'secret1' })).body;

  t.labId = (await Lab.create({ razonSocial: 'Lab Test' })).CodLab;
});

after(async () => { await detener(); });

test('admin crea medicamento válido y queda en su tenant', async () => {
  const r = await crearMed(t.adminA.token);
  assert.equal(r.status, 201);
  assert.equal(r.body.data.CodTenant, t.adminA.usuario.tenantId);
});

test('crear: stock negativo es rechazado (400)', async () => {
  const r = await crearMed(t.adminA.token, { stock: -5 });
  assert.equal(r.status, 400);
});

test('crear: precio negativo es rechazado (400)', async () => {
  const r = await crearMed(t.adminA.token, { precioVentaUni: -2.5 });
  assert.equal(r.status, 400);
});

test('crear: laboratorio inexistente es rechazado (400, no 500)', async () => {
  const r = await crearMed(t.adminA.token, { CodLab: 999999 });
  assert.equal(r.status, 400);
});

test('crear: no se puede enviar CodTenant ni CodMedicamento', async () => {
  const r = await api('POST', '/api/medicamentos', {
    token: t.adminA.token,
    body: { descripcionMed: 'Paracetamol', stock: 5, precioVentaUni: 2.5, CodTenant: 999, CodMedicamento: 1 }
  });
  assert.equal(r.status, 400);
  assert.equal(r.body.detalles.length, 2);
});

test('rol usuario no puede crear medicamentos (403)', async () => {
  const r = await crearMed(t.juan.token);
  assert.equal(r.status, 403);
});

test('rol moderador sí puede crear medicamentos', async () => {
  const r = await crearMed(t.marta.token, { descripcionMed: 'Ibuprofeno 400mg' });
  assert.equal(r.status, 201);
});

test('listado: cada uno solo ve los medicamentos de su tenant', async () => {
  const listaA = await api('GET', '/api/medicamentos', { token: t.adminA.token });
  const listaJuan = await api('GET', '/api/medicamentos', { token: t.juan.token });

  assert.equal(listaA.status, 200);
  assert.ok(listaA.body.every(m => m.CodTenant === t.adminA.usuario.tenantId));
  const idsA = new Set(listaA.body.map(m => m.CodMedicamento));
  assert.ok(!listaJuan.body.some(m => idsA.has(m.CodMedicamento)));
});

test('GET por id: medicamento de otro tenant responde 404', async () => {
  const id = await primerId(t.adminA.token);
  assert.equal((await api('GET', `/api/medicamentos/${id}`, { token: t.juan.token })).status, 404);
  assert.equal((await api('GET', `/api/medicamentos/${id}`, { token: t.adminA.token })).status, 200);
});

test('PUT: id no numérico responde 400 (no 500)', async () => {
  const r = await api('PUT', '/api/medicamentos/abc', { token: t.adminA.token, body: { stock: 1 } });
  assert.equal(r.status, 400);
});

test('PUT: no permite stock negativo', async () => {
  const id = await primerId(t.adminA.token);
  const r = await api('PUT', `/api/medicamentos/${id}`, { token: t.adminA.token, body: { stock: -10 } });
  assert.equal(r.status, 400);
});

test('PUT: no permite cambiar CodTenant', async () => {
  const id = await primerId(t.adminA.token);
  const r = await api('PUT', `/api/medicamentos/${id}`, { token: t.adminA.token, body: { CodTenant: 999 } });
  assert.equal(r.status, 400);
});

test('PUT: vencimiento anterior a fabricación es rechazado', async () => {
  const id = await primerId(t.adminA.token);
  const r = await api('PUT', `/api/medicamentos/${id}`, {
    token: t.adminA.token,
    body: { fechaFabricacion: '2026-01-01', fechaVencimiento: '2025-01-01' }
  });
  assert.equal(r.status, 400);
});

test('PUT: editar stock válido responde 200 y persiste', async () => {
  const id = await primerId(t.adminA.token);
  const r = await api('PUT', `/api/medicamentos/${id}`, { token: t.adminA.token, body: { stock: 42 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.stock, 42);
});

test('PUT: cuerpo vacío responde 400', async () => {
  const id = await primerId(t.adminA.token);
  const r = await api('PUT', `/api/medicamentos/${id}`, { token: t.adminA.token, body: {} });
  assert.equal(r.status, 400);
});

test('multi-tenant: adminB no ve ni edita ni borra medicamentos de Farmacia A', async () => {
  const idA = await primerId(t.adminA.token);
  assert.equal((await api('GET', '/api/medicamentos', { token: t.adminB.token })).body.length, 0);
  assert.equal((await api('GET', `/api/medicamentos/${idA}`, { token: t.adminB.token })).status, 404);
  assert.equal((await api('PUT', `/api/medicamentos/${idA}`, { token: t.adminB.token, body: { stock: 1 } })).status, 404);
  assert.equal((await api('DELETE', `/api/medicamentos/${idA}`, { token: t.adminB.token })).status, 404);
});

test('DELETE: usuario y moderador no pueden eliminar (403)', async () => {
  const id = await primerId(t.adminA.token);
  assert.equal((await api('DELETE', `/api/medicamentos/${id}`, { token: t.juan.token })).status, 403);
  assert.equal((await api('DELETE', `/api/medicamentos/${id}`, { token: t.marta.token })).status, 403);
});

test('DELETE: el dueño (admin) elimina y luego responde 404', async () => {
  const creada = await crearMed(t.adminA.token, { descripcionMed: 'Med a borrar' });
  const id = creada.body.data.CodMedicamento;
  assert.equal((await api('DELETE', `/api/medicamentos/${id}`, { token: t.adminA.token })).status, 200);
  assert.equal((await api('DELETE', `/api/medicamentos/${id}`, { token: t.adminA.token })).status, 404);
});

test('JSON inválido responde 400 y no filtra errores internos', async () => {
  const res = await fetch(`${t.base}/api/medicamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t.adminA.token}` },
    body: '{ esto no es json'
  });
  assert.equal(res.status, 400);
});
