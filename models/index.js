const sequelize = require('../config/db');
const Laboratorio = require('./Laboratorio');
const Medicamento = require('./Medicamento');

// Relación: Un Laboratorio tiene muchos Medicamentos
Laboratorio.hasMany(Medicamento, {
  foreignKey: 'CodLab',
  sourceKey: 'CodLab',
  onDelete: 'CASCADE'
});

// Relación inversa: Un Medicamento pertenece a un Laboratorio
Medicamento.belongsTo(Laboratorio, {
  foreignKey: 'CodLab',
  targetKey: 'CodLab'
});

module.exports = {
  sequelize,
  Laboratorio,
  Medicamento
};