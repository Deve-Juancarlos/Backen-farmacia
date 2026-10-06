const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Medicamento = sequelize.define('Medicamento', {
  CodMedicamento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descripcionMed: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  fechaFabricacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fechaVencimiento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  Presentacion: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  precioVentaUni: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  precioVentaPres: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  Marca: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'Medicamento',
  timestamps: false
});

module.exports = Medicamento;