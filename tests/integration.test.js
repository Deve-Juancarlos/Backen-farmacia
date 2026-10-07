process.env.DB_DIALECT = 'sqlite';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-prueba';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const { sequelize, Laboratorio } = require('../models');

let server;
let base;
let labId;

const api = async (method, path, { token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try { json = await res.json(); } catch { /* sin body */ }
  return { status: res.status, body: json };
};

const registrar = (datos) => api('POST', '/api/auth/registro', { body: datos });
const login = (datos) => api('POST', '/api/auth/login', { body: datos });

before(async () => {
  await app.crearApp();
  await new Promise(resolve => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
  const lab = await Laboratorio.create({ razonSocial: 'Lab Test' });
  labId = lab.CodLab;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  await sequelize.close();
});

test('la API responde 401 sin token', async () => {
  const r = await api('GET', '/api/medicamentos');
  assert.equal(r.status, 401);
});

test('la API responde 403 con token inválido', async () => {
  const r = await api('GET', '/api/medicamentos', { token: 'invalido' });
  assert.equal(r.status, 403);
});

test('registro: se puede crear farmacia nueva (admin de su tenant)', async () => {
  const r = await registrar({ username: 'adminA', password: 'secret1', nombreTenant: 'Farmacia A' });
  assert.equal(r.status, 201);
});

test('registro: el rol administrador sin nombreTenant es rechazado', async () => {
  const r = await registrar({ username: 'hack1', password: 'secret1', rol: 'administrador' });
  assert.equal(r.status, 400);
});

test('registro: duplicado de farmacia devuelve 409', async () => {
  const r = await registrar({ username: 'adminA2', password: 'secret1', nombreTenant: 'Farmacia A' });
  assert.equal(r.status, 409);
});

test('registro: usuario y moderador entran al tenant por defecto', async () => {
  const r1 = await registrar({ username: 'juan', password: 'secret1', rol: 'usuario' });
  const r2 = await registrar({ username: 'marta', password: 'secret1', rol: 'moderador' });
  assert.equal(r1.status, 201);
  assert.equal(r2.status, 201);
});

test('registro: datos inválidos devuelven 400', async () => {
  const r = await registrar({ username: 'ab', password: '123' });
  assert.equal(r.status, 400);
  assert.ok(r.body.detalles.length >= 2);
});

test('login: genera token con tenantId', async () => {
  const r = await login({ username: 'adminA', password: 'secret1' });
  assert.equal(r.status, 200);
  assert.ok(r.body.token);
  assert.ok(r.body.usuario.tenantId);
});

test('login: credenciales inválidas devuelven 401', async () => {
  const r = await login({ username: 'adminA', password: 'mala' });
  assert.equal(r.status, 401);
});

test('admin crea medicamento válido', async () => {
  const { body } = await login({ username: 'adminA', password: 'secret1' });
  const r = await api('POST', '/api/medicamentos', {
    token: body.token,
    body: { descripcionMed: 'Paracetamol 500mg', stock: 10, precioVentaUni: 2.5, CodLab: labId }
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.CodTenant, body.usuario.tenantId);
});

test('crear: stock negativo es rechazado (400)', async () => {
  const { body } = await login({ username: 'adminA', password: 'secret1' });
  const r = await api('POST', '/api/medicamentos', {
    token: body.token,
    body: { descripcionMed: 'Paracetamol', stock: -5, precioVentaUni: 2.5, CodLab: labId }
  });
  assert.equal(r.status, 400);
});

test('crear: precio negativo es rechazado (400)', async () => {
  const { body } = await login({ username: 'adminA', password: 'secret1' });
  const r = await api('POST', '/api/medicamentos', {
    token: body.token,
    body: { descripcionMed: 'Paracetamol', stock: 5, precioVentaUni: -2.5, CodLab: labId }
  });
  assert.equal(r.status, 400);
});

test('crear: laboratorio inexistente es rechazado (400, no 500)', async () => {
  const { body } = await login({ username: 'adminA', password: 'secret1' });
  const r = await api('POST', '/api/medicamentos', {
    token: body.token,
    body: { descripcionMed: 'Paracetamol', stock: 5, precioVentaUni: 2.5, CodLab: 999999 }
  });
  assert.equal(r.status, 400);
});

test('crear: no se puede enviar CodTenant ni CodMedicamento', async () => {
  const { body } = await login({ username: 'adminA', password: 'secret1' });
  const r = await api('POST', '/api/medicamentos', {
    token: body.token,
    body: { descripcionMed: 'Paracetamol', stock: 5, precioVentaUni: 2.5, CodTenant: 999, CodMedicamento: 1 }
  });
  assert.equal(r.status, 400);
  assert.equal(r.body.detalles.length, 2);
});

test('rol usuario no puede crear medicamentos (403)', async () => {
  const { body } = await login({ username: 'juan', password: 'secret1' });
  const r = await api('POST', '/api/medicamentos', {
    token: body.token,
    body: { descripcionMed: 'Paracetamol', stock: 5, precioVentaUni: 2.5, CodLab: labId }
  });
  assert.equal(r.status, 403);
});

test('rol moderador sí puede crear medicamentos', async () => {
  const { body } = await login({ username: 'marta', password: 'secret1' });
  const r = await api('POST', '/api/medicamentos', {
    token: body.token,
    body: { descripcionMed: 'Ibuprofeno 400mg', stock: 8, precioVentaUni: 3, CodLab: labId }
  });
  assert.equal(r.status, 201);
});

test('listado: cada uno solo ve los medicamentos de su tenant', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const juan = (await login({ username: 'juan', password: 'secret1' })).body;

  const listaA = await api('GET', '/api/medicamentos', { token: adminA.token });
  const listaJuan = await api('GET', '/api/medicamentos', { token: juan.token });

  assert.equal(listaA.status, 200);
  assert.ok(listaA.body.length >= 1, 'adminA ve sus medicamentos');
  assert.ok(
    listaA.body.every(m => m.CodTenant === adminA.usuario.tenantId),
    'adminA solo ve medicamentos de su tenant'
  );
  const idsA = new Set(listaA.body.map(m => m.CodMedicamento));
  assert.ok(
    !listaJuan.body.some(m => idsA.has(m.CodMedicamento)),
    'juan (tenant por defecto) no ve medicamentos de Farmacia A'
  );
});

test('GET por id: medicamento de otro tenant responde 404', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const creada = await api('POST', '/api/medicamentos', {
    token: adminA.token,
    body: { descripcionMed: 'Med secreto', stock: 1, precioVentaUni: 1, CodLab: labId }
  });
  const id = creada.body.data.CodMedicamento;

  const juan = (await login({ username: 'juan', password: 'secret1' })).body;
  const ajeno = await api('GET', `/api/medicamentos/${id}`, { token: juan.token });
  assert.equal(ajeno.status, 404);

  const propio = await api('GET', `/api/medicamentos/${id}`, { token: adminA.token });
  assert.equal(propio.status, 200);
});

test('PUT: id no numérico responde 400 (no 500)', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const r = await api('PUT', '/api/medicamentos/abc', { token: adminA.token, body: { stock: 1 } });
  assert.equal(r.status, 400);
});

test('PUT: no permite stock negativo', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const lista = await api('GET', '/api/medicamentos', { token: adminA.token });
  const id = lista.body[0].CodMedicamento;
  const r = await api('PUT', `/api/medicamentos/${id}`, { token: adminA.token, body: { stock: -10 } });
  assert.equal(r.status, 400);
});

test('PUT: no permite cambiar CodTenant (aislamiento no se puede pisar)', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const lista = await api('GET', '/api/medicamentos', { token: adminA.token });
  const id = lista.body[0].CodMedicamento;
  const r = await api('PUT', `/api/medicamentos/${id}`, { token: adminA.token, body: { CodTenant: 999 } });
  assert.equal(r.status, 400);
});

test('PUT: vencimiento anterior a fabricación es rechazado (validación combinada)', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const lista = await api('GET', '/api/medicamentos', { token: adminA.token });
  const id = lista.body[0].CodMedicamento;
  const r = await api('PUT', `/api/medicamentos/${id}`, {
    token: adminA.token,
    body: { fechaFabricacion: '2026-01-01', fechaVencimiento: '2025-01-01' }
  });
  assert.equal(r.status, 400);
});

test('PUT: editar stock válido responde 200 y persiste', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const lista = await api('GET', '/api/medicamentos', { token: adminA.token });
  const id = lista.body[0].CodMedicamento;
  const r = await api('PUT', `/api/medicamentos/${id}`, { token: adminA.token, body: { stock: 42 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.stock, 42);
});

test('PUT: cuerpo vacío responde 400', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const lista = await api('GET', '/api/medicamentos', { token: adminA.token });
  const r = await api('PUT', `/api/medicamentos/${lista.body[0].CodMedicamento}`, { token: adminA.token, body: {} });
  assert.equal(r.status, 400);
});

test('multi-tenant: adminB no ve ni edita medicamentos de Farmacia A', async () => {
  await registrar({ username: 'adminB', password: 'secret1', nombreTenant: 'Farmacia B' });
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const adminB = (await login({ username: 'adminB', password: 'secret1' })).body;

  const listaA = await api('GET', '/api/medicamentos', { token: adminA.token });
  const idA = listaA.body[0].CodMedicamento;

  const listaB = await api('GET', '/api/medicamentos', { token: adminB.token });
  assert.equal(listaB.body.length, 0, 'adminB no ve nada de A');

  const getAjeno = await api('GET', `/api/medicamentos/${idA}`, { token: adminB.token });
  assert.equal(getAjeno.status, 404);

  const putAjeno = await api('PUT', `/api/medicamentos/${idA}`, { token: adminB.token, body: { stock: 1 } });
  assert.equal(putAjeno.status, 404);

  const delAjeno = await api('DELETE', `/api/medicamentos/${idA}`, { token: adminB.token });
  assert.equal(delAjeno.status, 404);
});

test('DELETE: usuario y moderador no pueden eliminar (403)', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const lista = await api('GET', '/api/medicamentos', { token: adminA.token });
  const id = lista.body[0].CodMedicamento;

  const juan = (await login({ username: 'juan', password: 'secret1' })).body;
  const marta = (await login({ username: 'marta', password: 'secret1' })).body;

  assert.equal((await api('DELETE', `/api/medicamentos/${id}`, { token: juan.token })).status, 403);
  assert.equal((await api('DELETE', `/api/medicamentos/${id}`, { token: marta.token })).status, 403);
});

test('DELETE: el dueño (admin) elimina y luego responde 404', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const creada = await api('POST', '/api/medicamentos', {
    token: adminA.token,
    body: { descripcionMed: 'Med a borrar', stock: 1, precioVentaUni: 1, CodLab: labId }
  });
  const id = creada.body.data.CodMedicamento;

  assert.equal((await api('DELETE', `/api/medicamentos/${id}`, { token: adminA.token })).status, 200);
  assert.equal((await api('DELETE', `/api/medicamentos/${id}`, { token: adminA.token })).status, 404);
});

test('JSON inválido responde 400 y no filtra errores internos', async () => {
  const adminA = (await login({ username: 'adminA', password: 'secret1' })).body;
  const res = await fetch(`${base}/api/medicamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminA.token}` },
    body: '{ esto no es json'
  });
  assert.equal(res.status, 400);
});
