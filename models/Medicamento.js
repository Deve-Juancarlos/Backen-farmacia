const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Medicamento = sequelize.define('Medicamento', {
  CodMedicamento: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  CodTenant: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descripcionMed: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La descripción es obligatoria' },
      len: { args: [3, 150], msg: 'La descripción debe tener entre 3 y 150 caracteres' }
    }
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
    allowNull: true,
    validate: { len: { args: [0, 50], msg: 'La presentación no puede superar 50 caracteres' } }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: { msg: 'El stock debe ser un número entero' },
      min: { args: [0], msg: 'El stock no puede ser negativo' }
    }
  },
  precioVentaUni: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'El precio unitario no puede ser negativo' }
    }
  },
  precioVentaPres: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'El precio por presentación no puede ser negativo' }
    }
  },
  Marca: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: { len: { args: [0, 50], msg: 'La marca no puede superar 50 caracteres' } }
  }
}, {
  tableName: 'Medicamento',
  timestamps: false,
  validate: {
    vencimientoPosteriorAFabricacion() {
      if (this.fechaFabricacion && this.fechaVencimiento &&
          new Date(this.fechaVencimiento) < new Date(this.fechaFabricacion)) {
        throw new Error('La fecha de vencimiento debe ser posterior a la de fabricación');
      }
    }
  }
});

module.exports = Medicamento;
