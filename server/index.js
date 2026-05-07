require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('=== INICIANDO SERVER (index.js) ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ configurada' : '✗ no configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ configurado' : '✗ no configurado');

const app = express();
app.use(cors());
app.use(express.json());

const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const categoriasRoutes = require('./routes/categorias');
const descuentosRoutes = require('./routes/descuentos');
const cuponesRoutes = require('./routes/cupones');
const pedidosRoutes = require('./routes/pedidos');
const contenidosRoutes = require('./routes/contenidos');
const configRoutes = require('./routes/config');
const slidesRoutes = require('./routes/slides');

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/descuentos', descuentosRoutes);
app.use('/api/cupones', cuponesRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/contenidos', contenidosRoutes);
app.use('/api/config', configRoutes);
app.use('/api/slides', slidesRoutes);

const clientDist = path.join(__dirname, '../client/dist');
const clientPublic = path.join(__dirname, '../client/public');
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');

app.use('/uploads', express.static(uploadsDir));

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else if (fs.existsSync(clientPublic)) {
  app.use(express.static(clientPublic));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPublic, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message, err.stack?.split('\n')[1]);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
});

sequelize.authenticate()
  .then(() => {
    console.log('✓ DB connected');
    return sequelize.sync();
  })
  .then(() => {
    console.log('✓ DB synced');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('FATAL ERROR:', err.message);
    process.exit(1);
  });