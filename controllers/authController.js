const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const usuarios = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    rol: 'administrador'
  }
];

// Registro de usuario
exports.registrar = async (req, res) => {
  try {
    const { username, password, rol } = req.body;
    
    const existe = usuarios.find(u => u.username === username);
    if (existe) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const nuevoUsuario = {
      id: usuarios.length + 1,
      username,
      password: passwordHash,
      rol: rol || 'usuario'
    };
    usuarios.push(nuevoUsuario);

    res.status(201).json({ mensaje: 'Usuario registrado', usuario: nuevoUsuario.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const usuario = usuarios.find(u => u.username === username);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, usuario: { id: usuario.id, username: usuario.username, rol: usuario.rol } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};