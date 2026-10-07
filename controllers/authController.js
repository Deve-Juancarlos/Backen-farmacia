const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Tenant, asegurarTenantPorDefecto } = require('../models');
const { validarRegistro, validarLogin } = require('../validators/authValidator');

// Usuarios en memoria (se pierden al reiniciar el servidor).
// El rol NUNCA se toma del body del cliente: se asigna aquí.
const usuarios = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    rol: 'administrador',
    tenantId: null // se resuelve contra el tenant por defecto al hacer login
  }
];

async function resolverTenantDeUsuario(usuario) {
  if (usuario.tenantId) return usuario.tenantId;
  const tenant = await asegurarTenantPorDefecto();
  return tenant.CodTenant;
}

// Registro de usuario
// - Por defecto: entra al tenant (farmacia) por defecto con rol 'usuario'.
// - Con nombreTenant: crea una farmacia nueva y el usuario queda como su administrador.
// - 'rol' solo puede ser usuario|moderador (validado); 'administrador' requiere nombreTenant.
exports.registrar = async (req, res) => {
  const { errores, datos } = validarRegistro(req.body);
  if (errores.length) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  }

  const existe = usuarios.find(u => u.username === datos.username);
  if (existe) {
    return res.status(400).json({ error: 'Usuario ya existe' });
  }

  try {
    const passwordHash = await bcrypt.hash(datos.password, 10);
    let tenantId;
    let rol;

    if (datos.nombreTenant) {
      let tenant;
      try {
        tenant = await Tenant.create({ nombre: datos.nombreTenant, activo: true });
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(409).json({ error: 'Ya existe una farmacia con ese nombre' });
        }
        throw error;
      }
      tenantId = tenant.CodTenant;
      rol = 'administrador';
    } else {
      const tenant = await asegurarTenantPorDefecto();
      tenantId = tenant.CodTenant;
      rol = datos.rol;
    }

    const nuevoUsuario = {
      id: usuarios.length + 1,
      username: datos.username,
      password: passwordHash,
      rol,
      tenantId
    };
    usuarios.push(nuevoUsuario);

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
    const usuario = usuarios.find(u => u.username === datos.username);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(datos.password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tenantId = await resolverTenantDeUsuario(usuario);

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant || tenant.activo === false) {
      return res.status(403).json({ error: 'La farmacia asociada a tu cuenta está desactivada' });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, rol: usuario.rol, tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, username: usuario.username, rol: usuario.rol, tenantId }
    });
  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};
