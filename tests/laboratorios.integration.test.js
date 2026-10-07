const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciarServidor } = require('./helpers/servidor');

let api, registrar, login, detener, Lab;
const t = {};

before(async () => {
  ({ api, registrar, login, detener, Lab } = await iniciarServidor());

  await registrar({ username: 'adminLab', password: 'secret1', nombreTenant: 'Farmacia Lab' });
  t.admin = (await login({ username: 'adminLab', password: 'secret1' })).body;
  t.lab = await Lab.create({ razonSocial: 'Bayer S.A.' });
});

after(async () => { await detener(); });

test('laboratorios: requiere autenticación (401)', async () => {
  assert.equal((await api('GET', '/api/laboratorios')).status, 401);
});

test('laboratorios: lista el catálogo con CodLab y razón social', async () => {
  const r = await api('GET', '/api/laboratorios', { token: t.admin.token });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body));
  assert.ok(r.body.some((l) => l.CodLab === t.lab.CodLab && l.razonSocial === 'Bayer S.A.'));
});

test('medicamento: se crea sin laboratorio (CodLab null)', async () => {
  const r = await api('POST', '/api/medicamentos', {
    token: t.admin.token,
    body: { descripcionMed: 'Sin lab', stock: 3, precioVentaUni: 1 }
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.CodLab, null);
});

test('medicamento: se puede asignar un laboratorio existente', async () => {
  const creada = await api('POST', '/api/medicamentos', {
    token: t.admin.token,
    body: { descripcionMed: 'Con lab', stock: 3, precioVentaUni: 1, CodLab: t.lab.CodLab }
  });
  assert.equal(creada.status, 201);
  assert.equal(creada.body.data.CodLab, t.lab.CodLab);

  const id = creada.body.data.CodMedicamento;
  const editada = await api('PUT', `/api/medicamentos/${id}`, {
    token: t.admin.token,
    body: { CodLab: null }
  });
  assert.equal(editada.status, 200);
  assert.equal(editada.body.data.CodLab, null);
});
