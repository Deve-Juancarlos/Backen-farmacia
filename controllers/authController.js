const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario, Tenant, asegurarTenantPorDefecto } = require('../models');
const { validarRegistro, validarLogin } = require('../validators/authValidator');

// Crea el administrador por defecto si no existe todavía.
// Usuario: admin / Contraseña: admin123 (cambiar en producción).
async function asegurarAdminPorDefecto() {
  const tenant = await asegurarTenantPorDefecto();
  const [admin] = await Usuario.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10),
      rol: 'administrador',
      activo: true,
      CodTenant: tenant.CodTenant
    }
  });
  return admin;
}

function firmarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.CodUsuario,
      username: usuario.username,
      rol: usuario.rol,
      tenantId: usuario.CodTenant
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

// Registro de usuario
// - Por defecto: entra al tenant (farmacia) por defecto con rol 'usuario' o 'moderador'.
// - Con nombreTenant: crea una farmacia nueva y el usuario queda como su administrador.
exports.registrar = async (req, res) => {
  const { errores, datos } = validarRegistro(req.body);
  if (errores.length) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  }

  try {
    const existe = await Usuario.findOne({ where: { username: datos.username } });
    if (existe) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(datos.password, 10);
    let tenant;
    let rol;

    if (datos.nombreTenant) {
      try {
        tenant = await Tenant.create({ nombre: datos.nombreTenant, activo: true });
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(409).json({ error: 'Ya existe una farmacia con ese nombre' });
        }
        throw error;
      }
      rol = 'administrador';
    } else {
      tenant = await asegurarTenantPorDefecto();
      rol = datos.rol;
    }

    const nuevoUsuario = await Usuario.create({
      username: datos.username,
      passwordHash,
      rol,
      activo: true,
      CodTenant: tenant.CodTenant
    });

    res.status(201).json({ mensaje: 'Usuario registrado', usuario: nuevoUsuario.username });
  } catch (error) {
    console.error('[registro]', error);
    res.status(500).json({ error: 'Error interno al registrar el usuario' });
  }
};

// Login
exports.login = async (req, res) => {
  const { errores, datos } = validarLogin(req.body);
  if (errores.length) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  }

  try {
    const usuario = await Usuario.scope('conPassword').findOne({
      where: { username: datos.username },
      include: [{ model: Tenant }]
    });

    const passwordValido = usuario && await bcrypt.compare(datos.password, usuario.passwordHash);
    if (!usuario || !passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Tu cuenta está desactivada' });
    }

    if (!usuario.Tenant || usuario.Tenant.activo === false) {
      return res.status(403).json({ error: 'La farmacia asociada a tu cuenta está desactivada' });
    }

    const token = firmarToken(usuario);

    res.json({
      token,
      usuario: {
        id: usuario.CodUsuario,
        username: usuario.username,
        rol: usuario.rol,
        tenantId: usuario.CodTenant
      }
    });
  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

exports.asegurarAdminPorDefecto = asegurarAdminPorDefecto;
