const express = require('express');
const { Cupon, Usuario } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cupones = await Cupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json(cupones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { descuento_porcentaje } = req.body;
    const codigo = 'COIL' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const cupon = await Cupon.create({ codigo, descuento_porcentaje, activo: true });
    res.status(201).json(cupon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/validar', async (req, res) => {
  try {
    const { codigo, usuario_id } = req.body;
    const cupon = await Cupon.findOne({ where: { codigo, activo: true } });
    if (!cupon) return res.status(404).json({ valido: false, error: 'Cupón no válido' });
    if (cupon.usado_por) return res.status(400).json({ valido: false, error: 'Cupón ya utilizado' });
    if (usuario_id && cupon.usado_por && cupon.usado_por !== usuario_id) {
      return res.status(400).json({ valido: false, error: 'Cupón ya utilizado' });
    }
    res.json({ valido: true, descuento: cupon.descuento_porcentaje, codigo: cupon.codigo });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const cupon = await Cupon.findByPk(req.params.id);
    if (!cupon) return res.status(404).json({ error: 'Cupón no encontrado' });
    const { activo } = req.body;
    await cupon.update({ activo });
    res.json(cupon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const cupon = await Cupon.findByPk(req.params.id);
    if (!cupon) return res.status(404).json({ error: 'Cupón no encontrado' });
    await cupon.destroy();
    res.json({ message: 'Cupón eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;