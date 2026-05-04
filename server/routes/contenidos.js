const express = require('express');
const { Contenido } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const contenidos = await Contenido.findAll({ order: [['orden', 'ASC']] });
    res.json(contenidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { tipo, url, orden } = req.body;
    const contenido = await Contenido.create({ tipo, url, orden: orden || 0 });
    res.status(201).json(contenido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const contenido = await Contenido.findByPk(req.params.id);
    if (!contenido) return res.status(404).json({ error: 'Contenido no encontrado' });
    const { tipo, url, orden } = req.body;
    await contenido.update({ tipo, url, orden });
    res.json(contenido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const contenido = await Contenido.findByPk(req.params.id);
    if (!contenido) return res.status(404).json({ error: 'Contenido no encontrado' });
    await contenido.destroy();
    res.json({ message: 'Contenido eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;