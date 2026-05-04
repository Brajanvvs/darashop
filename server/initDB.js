require('dotenv').config();
const { sequelize, Usuario, Categoria, Producto, DescuentoProducto, Cupon, Pedido, PedidoItem, Contenido, Config } = require('./models');
const bcrypt = require('bcryptjs');

const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexión exitosa');
    await sequelize.sync({ force: true });
    console.log('✓ Base de datos sincronizada');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await Usuario.create({
      nombre: 'Admin',
      email: 'admin@coil.com',
      telefono: '5210000000000',
      password: adminPassword,
      rol: 'admin'
    });
    console.log('✓ Admin creado: admin@coil.com / admin123');
    
    await Config.create({
      nombre_tienda: 'Coil Shop',
      titulo_pagina: 'Coil Shop - Tu tienda online',
      descripcion: 'Los mejores productos al mejor precio',
      bienvenido_texto: 'Bienvenido a Coil Shop'
    });
    
    const catTecnologia = await Categoria.create({ nombre: 'Tecnología', descuento_porcentaje: 10 });
    const catRopa = await Categoria.create({ nombre: 'Ropa', descuento_porcentaje: 0 });
    const catAccesorios = await Categoria.create({ nombre: 'Accesorios', descuento_porcentaje: 5 });
    
    await Producto.create({
      nombre: 'Smartphone Pro',
      titulo: 'Último modelo',
      descripcion: 'Teléfono inteligente de última generación con pantalla AMOLED y cámara de 108MP',
      imagen_url: '/uploads/placeholder.jpg',
      precio: 15000,
      categoria_id: catTecnologia.id
    });
    
    await Producto.create({
      nombre: 'Laptop Ultra',
      titulo: 'Potencia extrema',
      descripcion: 'Laptop con procesador M2, 16GB RAM y pantalla Retina',
      imagen_url: '/uploads/placeholder.jpg',
      precio: 25000,
      categoria_id: catTecnologia.id
    });
    
    await Producto.create({
      nombre: 'Audífonos Bluetooth',
      titulo: 'Sonido premium',
      descripcion: 'Audífonos con cancelación activa de ruido y 30hrs de batería',
      imagen_url: '/uploads/placeholder.jpg',
      precio: 2500,
      categoria_id: catAccesorios.id
    });
    
    console.log('✓ Productos de ejemplo criados');
    console.log('✓ Base de datos lista');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

initDB();