const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Producto, Categoria, DescuentoProducto } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const productos = await Producto.findAll({ 
      where: { activo: true },
      include: [{ model: Categoria }, { model: DescuentoProducto }],
      order: [['createdAt', 'DESC']]
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [Categoria, DescuentoProducto]
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, titulo, descripcion, precio, categoria_id } = req.body;
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;
    const producto = await Producto.create({ nombre, titulo, descripcion, precio, imagen_url, categoria_id });
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, upload.single('imagen'), async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    
    const { nombre, titulo, descripcion, precio, categoria_id, activo } = req.body;
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : producto.imagen_url;
    
    await producto.update({ nombre, titulo, descripcion, precio, imagen_url, categoria_id, activo });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    await producto.update({ activo: false });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;