const express = require('express');
const cors = require('cors');
const { sequelize, asegurarTenantPorDefecto } = require('./models');
const authController = require('./controllers/authController');
const authRoutes = require('./routes/authRoutes');
const medicamentoRoutes = require('./routes/medicamentoRoutes');
const laboratorioRoutes = require('./routes/laboratorioRoutes');
require('dotenv').config();

const app = express();

// CORS: permite varios orígenes separados por coma. Por defecto, cualquiera.
const origenesPermitidos = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : '*';
app.use(cors({ origin: origenesPermitidos }));

app.use(express.json({ limit: '100kb' }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/medicamentos', medicamentoRoutes);
app.use('/api/laboratorios', laboratorioRoutes);

// 404 para rutas desconocidas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador global de errores: no filtra mensajes internos al cliente
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Cuerpo JSON inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo de la petición es demasiado grande' });
  }
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Sincroniza la BD y garantiza el tenant y el admin por defecto.
// DB_SYNC_ALTER=true aplica cambios de esquema sin borrar datos (solo desarrollo).
const crearApp = async () => {
  await sequelize.sync(process.env.DB_SYNC_ALTER === 'true' ? { alter: true } : {});
  await asegurarTenantPorDefecto();
  await authController.asegurarAdminPorDefecto();
  return app;
};

if (require.main === module) {
  crearApp()
    .then(() => {
      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log('Base de datos conectada');
        console.log(`Servidor corriendo en puerto ${port}`);
      });
    })
    .catch(err => {
      console.error('Error de conexión:', err.message);
      process.exit(1);
    });
}

module.exports = app;
module.exports.crearApp = crearApp;
