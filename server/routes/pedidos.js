const express = require('express');
const { Pedido, PedidoItem, Producto, Usuario, Categoria, DescuentoProducto } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const calcularDescuento = (producto, descuentosProducto, categoria) => {
  let descuento = 0;
  if (categoria?.descuento_porcentaje) descuento = categoria.descuento_porcentaje;
  const descuentoEspecifico = descuentosProducto.find(d => d.Producto?.id === producto.id);
  if (descuentoEspecifico?.descuento_porcentaje && descuentoEspecifico.descuento_porcentaje > descuento) {
    descuento = descuentoEspecifico.descuento_porcentaje;
  }
  return descuento;
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = req.usuario.rol === 'admin' ? {} : { usuario_id: req.usuario.id };
    const pedidos = await Pedido.findAll({
      where,
      include: [{ model: Usuario }, { model: PedidoItem, include: [Producto] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, cupon_codigo } = req.body;
    const usuario_id = req.usuario.id;
    
    let descuentoTotal = 0;
    let cuponAplicado = null;
    
    if (cupon_codigo) {
      const { Cupon } = require('../models');
      const cupon = await Cupon.findOne({ where: { codigo: cupon_codigo, activo: true } });
      if (cupon && !cupon.usado_por) {
        descuentoTotal = cupon.descuento_porcentaje;
        cuponAplicado = cupon_codigo;
        await cupon.update({ usado_por: usuario_id });
      }
    }
    
    let total = 0;
    const pedidoItems = [];
    
    for (const item of items) {
      const producto = await Producto.findByPk(item.producto_id, { include: [Categoria, DescuentoProducto] });
      if (!producto) continue;
      
      const descuento = calcularDescuento(producto, producto.DescuentoProductos || [], producto.Categorium);
      const precioBase = parseFloat(producto.precio);
      const precioConDescuento = precioBase * (1 - descuento / 100);
      total += precioConDescuento * item.cantidad;
      
      pedidoItems.push({ producto_id: item.producto_id, cantidad: item.cantidad, precio: precioConDescuento });
    }
    
    const descuentoMonto = total * (descuentoTotal / 100);
    total = total - descuentoMonto;
    
    const pedido = await Pedido.create({
      usuario_id,
      estado: 'proceso',
      total,
      cupon_aplicado: cuponAplicado,
      descuento_total: descuentoMonto
    });
    
    for (const item of pedidoItems) {
      await PedidoItem.create({ ...item, pedido_id: pedido.id });
    }
    
    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [{ model: Usuario }, { model: PedidoItem, include: [Producto] }]
    });
    
    res.status(201).json(pedidoCompleto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    const { estado } = req.body;
    await pedido.update({ estado });
    res.json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;