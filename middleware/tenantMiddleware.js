// Aísla la petición al tenant (farmacia/sucursal) del usuario autenticado.
// Debe usarse después de verificarToken. El tenant NUNCA se toma del body ni
// de query params: siempre del JWT.
exports.scopeTenant = (req, res, next) => {
  const tenantId = req.usuario && req.usuario.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tu cuenta no tiene una farmacia (tenant) asignada' });
  }

  req.tenantId = tenantId;
  next();
};
