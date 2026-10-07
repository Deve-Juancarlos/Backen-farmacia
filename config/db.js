const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'mysql';

const opciones = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect,
  logging: false
};

// SQLite (usado en los tests) siempre en memoria salvo storage explícito.
if (dialect === 'sqlite') {
  opciones.storage = process.env.DB_STORAGE || ':memory:';
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  opciones
);

module.exports = sequelize;
