const express = require('express');
const { DescuentoProducto, Producto } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/producto', async (req, res) => {
  try {
    const descuentos = await DescuentoProducto.findAll({ include: Producto });
    res.json(descuentos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/producto', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { producto_id, descuento_porcentaje } = req.body;
    const descuento = await DescuentoProducto.findOne({ where: { producto_id } });
    if (descuento) {
      await descuento.update({ descuento_porcentaje });
      return res.json(descuento);
    }
    const nuevo = await DescuentoProducto.create({ producto_id, descuento_porcentaje });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/producto/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const descuento = await DescuentoProducto.findByPk(req.params.id);
    if (!descuento) return res.status(404).json({ error: 'Descuento no encontrado' });
    await descuento.destroy();
    res.json({ message: 'Descuento eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;