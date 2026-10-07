// Limitador de intentos en memoria (sin dependencias externas).
// Cuenta únicamente las respuestas 401, para no bloquear a usuarios válidos.
function limitarLogin({ maxIntentos = 5, ventanaMs = 15 * 60 * 1000 } = {}) {
  const intentos = new Map();

  return (req, res, next) => {
    const clave = `${req.ip}:${(req.body && req.body.username) || 'anonimo'}`;
    const ahora = Date.now();
    let registro = intentos.get(clave);

    if (!registro || ahora - registro.desde > ventanaMs) {
      registro = { count: 0, desde: ahora };
      intentos.set(clave, registro);
    }

    if (registro.count >= maxIntentos) {
      return res.status(429).json({ error: 'Demasiados intentos fallidos. Espere unos minutos.' });
    }

    res.on('finish', () => {
      if (res.statusCode === 401) {
        registro.count += 1;
      } else if (res.statusCode < 400) {
        intentos.delete(clave);
      }
    });

    next();
  };
}

module.exports = { limitarLogin };
