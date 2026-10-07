const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ROLES = ['usuario', 'moderador', 'administrador'];

const Usuario = sequelize.define('Usuario', {
  CodUsuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'El usuario es obligatorio' },
      len: { args: [3, 50], msg: 'El usuario debe tener entre 3 y 50 caracteres' }
    }
  },
  passwordHash: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  rol: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'usuario',
    validate: {
      isIn: { args: [ROLES], msg: `El rol debe ser uno de: ${ROLES.join(', ')}` }
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  CodTenant: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Usuario',
  defaultScope: {
    attributes: { exclude: ['passwordHash'] }
  },
  scopes: {
    // Necesario para poder comparar el hash en el login.
    conPassword: { attributes: { include: ['passwordHash'] } }
  }
});

Usuario.ROLES = ROLES;

module.exports = Usuario;
