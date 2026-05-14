require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

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

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

function connectDB(retries = 10, delay = 3000) {
  sequelize.authenticate()
    .then(() => {
      console.log('✓ DB connected');
      return sequelize.sync({ alter: true });
    })
    .then(() => {
      console.log('✓ DB synced (alter: added missing columns)');
    })
    .catch(err => {
      console.error(`DB connection failed (${retries} retries left):`, err.message);
      if (retries > 0) {
        setTimeout(() => connectDB(retries - 1, delay), delay);
      } else {
        console.error('FATAL: Could not connect to DB after all retries');
      }
    });
}