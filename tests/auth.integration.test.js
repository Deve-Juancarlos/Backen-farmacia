const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciarServidor } = require('./helpers/servidor');

let api, registrar, login, detener;

before(async () => {
  ({ api, registrar, login, detener } = await iniciarServidor());
});

after(async () => { await detener(); });

test('la API responde 401 sin token', async () => {
  const r = await api('GET', '/api/medicamentos');
  assert.equal(r.status, 401);
});

test('la API responde 401 con token inválido', async () => {
  const r = await api('GET', '/api/medicamentos', { token: 'invalido' });
  assert.equal(r.status, 401);
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

test('login: el admin por defecto (admin/admin123) existe y funciona', async () => {
  const r = await login({ username: 'admin', password: 'admin123' });
  assert.equal(r.status, 200);
  assert.equal(r.body.usuario.rol, 'administrador');
  assert.ok(r.body.usuario.tenantId);
});

test('seguridad: nunca se devuelve el hash de la contraseña', async () => {
  const registro = await registrar({ username: 'sinHash', password: 'secret1' });
  const sesion = await login({ username: 'sinHash', password: 'secret1' });
  assert.equal(registro.body.usuario.passwordHash, undefined);
  assert.equal(registro.body.passwordHash, undefined);
  assert.equal(sesion.body.usuario.passwordHash, undefined);
  assert.equal(sesion.body.passwordHash, undefined);
});
