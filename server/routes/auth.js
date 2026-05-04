const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, email, telefono, password: hashedPassword });
    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ usuario: { id: req.usuario.id, nombre: req.usuario.nombre, email: req.usuario.email, telefono: req.usuario.telefono, rol: req.usuario.rol } });
});

module.exports = router;