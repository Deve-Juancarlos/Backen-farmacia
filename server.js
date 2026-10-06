const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const medicamentoRoutes = require('./routes/medicamentoRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/medicamentos', medicamentoRoutes);

// Sincronizar BD e iniciar servidor
sequelize.sync()
  .then(() => {
    console.log('Base de datos conectada');
    app.listen(process.env.PORT, () => {
      console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('Error de conexión:', err));