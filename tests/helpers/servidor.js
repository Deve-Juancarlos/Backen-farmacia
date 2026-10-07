process.env.DB_DIALECT = 'sqlite';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-prueba';

const app = require('../../server');
const { sequelize, Laboratorio } = require('../../models');

// Levanta la app en un puerto efímero y devuelve utilidades para los tests.
async function iniciarServidor() {
  await app.crearApp();

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

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

  const detener = async () => {
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  };

  return { api, registrar, login, detener, base, Lab: Laboratorio };
}

module.exports = { iniciarServidor };
