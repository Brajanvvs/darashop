const { Sequelize, DataTypes } = require('sequelize');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false, dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false
      }
    );

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  telefono: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING },
  rol: { type: DataTypes.STRING, defaultValue: 'cliente' }
}, { tableName: 'usuarios', timestamps: true });

const Categoria = sequelize.define('Categoria', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  descuento_porcentaje: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'categorias', timestamps: true });

const Producto = sequelize.define('Producto', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  titulo: { type: DataTypes.STRING },
  descripcion: { type: DataTypes.TEXT },
  imagen_url: { type: DataTypes.STRING },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  categoria_id: { type: DataTypes.UUID },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'productos', timestamps: true });

const DescuentoProducto = sequelize.define('DescuentoProducto', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  descuento_porcentaje: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'descuentos_producto', timestamps: true });

const Cupon = sequelize.define('Cupon', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false },
  descuento_porcentaje: { type: DataTypes.INTEGER, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'cupones', timestamps: true });

const Pedido = sequelize.define('Pedido', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  estado: { type: DataTypes.STRING, defaultValue: 'proceso' },
  total: { type: DataTypes.DECIMAL(10, 2) },
  cupon_aplicado: { type: DataTypes.STRING },
  descuento_total: { type: DataTypes.DECIMAL(10, 2) }
}, { tableName: 'pedidos', timestamps: true });

const PedidoItem = sequelize.define('PedidoItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cantidad: { type: DataTypes.INTEGER, defaultValue: 1 },
  precio: { type: DataTypes.DECIMAL(10, 2) }
}, { tableName: 'pedido_items', timestamps: true });

const Contenido = sequelize.define('Contenido', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tipo: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  orden: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'contenidos', timestamps: true });

const Config = sequelize.define('Config', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre_tienda: { type: DataTypes.STRING, defaultValue: 'Dara Maison' },
  titulo_pagina: { type: DataTypes.STRING, defaultValue: 'Dara Maison - Tu identidad es tu espectáculo' },
  descripcion: { type: DataTypes.TEXT, defaultValue: 'No vendemos productos; transformamos el aura de los grandes íconos musicales en experiencias tangibles de alta actitud.' },
  bienvenido_texto: { type: DataTypes.STRING, defaultValue: 'Dara Maison' },
  whatsapp_number: { type: DataTypes.STRING, defaultValue: '521XXXXXXXXXX' }
}, { tableName: 'config', timestamps: true });

const Slide = sequelize.define('Slide', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  imagen_url: { type: DataTypes.STRING, allowNull: false },
  titulo: { type: DataTypes.STRING },
  subtitulo: { type: DataTypes.TEXT },
  orden: { type: DataTypes.INTEGER, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'slides', timestamps: true });

Categoria.hasMany(Producto, { foreignKey: 'categoria_id' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id' });

Producto.hasMany(DescuentoProducto, { foreignKey: 'producto_id' });
DescuentoProducto.belongsTo(Producto, { foreignKey: 'producto_id' });

Usuario.hasMany(Pedido, { foreignKey: 'usuario_id' });
Pedido.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Pedido.hasMany(PedidoItem, { foreignKey: 'pedido_id' });
PedidoItem.belongsTo(Pedido, { foreignKey: 'pedido_id' });

module.exports = { sequelize, Usuario, Categoria, Producto, DescuentoProducto, Cupon, Pedido, PedidoItem, Contenido, Config, Slide };