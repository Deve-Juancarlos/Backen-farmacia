const sequelize = require('../config/db');
const Laboratorio = require('./Laboratorio');
const Medicamento = require('./Medicamento');
const Tenant = require('./Tenant');
const Usuario = require('./Usuario');

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

// Relación: Un Tenant (farmacia/sucursal) tiene muchos Medicamentos
Tenant.hasMany(Medicamento, {
  foreignKey: 'CodTenant',
  sourceKey: 'CodTenant',
  onDelete: 'CASCADE'
});

Medicamento.belongsTo(Tenant, {
  foreignKey: 'CodTenant',
  targetKey: 'CodTenant'
});

// Relación: Un Tenant tiene muchos Usuarios
Tenant.hasMany(Usuario, {
  foreignKey: 'CodTenant',
  sourceKey: 'CodTenant',
  onDelete: 'CASCADE'
});

Usuario.belongsTo(Tenant, {
  foreignKey: 'CodTenant',
  targetKey: 'CodTenant'
});

// Garantiza el tenant por defecto (para cuentas sin tenant propio).
async function asegurarTenantPorDefecto() {
  const [tenant] = await Tenant.findOrCreate({
    where: { nombre: 'Farmacia Default' },
    defaults: { nombre: 'Farmacia Default', activo: true }
  });
  return tenant;
}

module.exports = {
  sequelize,
  Laboratorio,
  Medicamento,
  Tenant,
  Usuario,
  asegurarTenantPorDefecto
};
