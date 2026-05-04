const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Slide } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/slides');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const slides = await Slide.findAll({ where: { activo: true }, order: [['orden', 'ASC']] });
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, upload.single('imagen'), async (req, res) => {
  try {
    const { titulo, subtitulo, orden } = req.body;
    const imagen_url = req.file ? `/uploads/slides/${req.file.filename}` : null;
    const slide = await Slide.create({ imagen_url, titulo, subtitulo, orden: parseInt(orden) || 0 });
    res.status(201).json(slide);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, upload.single('imagen'), async (req, res) => {
  try {
    const slide = await Slide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ error: 'Slide no encontrado' });
    const { titulo, subtitulo, orden, activo } = req.body;
    const imagen_url = req.file ? `/uploads/slides/${req.file.filename}` : slide.imagen_url;
    await slide.update({ imagen_url, titulo, subtitulo, orden: parseInt(orden) || 0, activo: activo !== 'false' });
    res.json(slide);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const slide = await Slide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ error: 'Slide no encontrado' });
    await slide.update({ activo: false });
    res.json({ message: 'Slide eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
