// Validaciones de auth sin dependencias externas.

function validarRegistro(body) {
  const errores = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errores: ['El cuerpo de la petición debe ser un objeto JSON'], datos: {} };
  }

  const { username, password, nombreTenant } = body;

  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 50 || /\s/.test(username)) {
    errores.push('username debe ser un texto de 3 a 50 caracteres sin espacios');
  }

  if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
    errores.push('password debe tener entre 6 y 100 caracteres');
  }

  let tenantNombre = null;
  if (nombreTenant !== undefined && nombreTenant !== null && nombreTenant !== '') {
    if (typeof nombreTenant !== 'string' || nombreTenant.trim().length < 3 || nombreTenant.trim().length > 100) {
      errores.push('nombreTenant debe ser un texto de 3 a 100 caracteres');
    } else {
      tenantNombre = nombreTenant.trim();
    }
  }

  // El rol solo puede ser usuario o moderador: los administradores se crean
  // creando su propia farmacia (nombreTenant). Antes se aceptaba 'administrador'
  // desde el body y cualquier persona podía autoadministrarse.
  let rol = 'usuario';
  if (body.rol !== undefined && body.rol !== null && body.rol !== '') {
    if (body.rol === 'usuario' || body.rol === 'moderador') {
      rol = body.rol;
    } else {
      errores.push("rol debe ser 'usuario' o 'moderador' (los administradores se crean enviando nombreTenant)");
    }
  }

  return {
    errores,
    datos: {
      username: typeof username === 'string' ? username.trim() : username,
      password,
      nombreTenant: tenantNombre,
      rol
    }
  };
}

function validarLogin(body) {
  const errores = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errores: ['El cuerpo de la petición debe ser un objeto JSON'], datos: {} };
  }

  const { username, password } = body;

  if (typeof username !== 'string' || !username.trim()) {
    errores.push('username es obligatorio');
  }
  if (typeof password !== 'string' || !password) {
    errores.push('password es obligatorio');
  }

  return { errores, datos: { username, password } };
}

module.exports = { validarRegistro, validarLogin };
