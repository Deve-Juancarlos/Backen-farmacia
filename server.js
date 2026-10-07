const express = require('express');
const cors = require('cors');
const { sequelize, asegurarTenantPorDefecto } = require('./models');
const authRoutes = require('./routes/authRoutes');
const medicamentoRoutes = require('./routes/medicamentoRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/medicamentos', medicamentoRoutes);

// 404 para rutas desconocidas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador global de errores: no filtra mensajes internos al cliente
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Cuerpo JSON inválido' });
  }
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Sincroniza la BD y garantiza el tenant por defecto
const crearApp = async () => {
  await sequelize.sync();
  await asegurarTenantPorDefecto();
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
