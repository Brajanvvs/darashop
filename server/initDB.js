const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false })
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

async function initDB() {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexión exitosa');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✓ Base de datos sincronizada');

    // Check if admin exists
    const [admins] = await sequelize.query(
      "SELECT * FROM usuarios WHERE rol = 'admin' LIMIT 1"
    );

    if (admins.length === 0) {
      console.log('⚠ No hay admin. Crea uno manualmente o usa POST /api/auth/register');
    } else {
      console.log('✓ Admin existe:', admins[0].email);
    }

    console.log('✓ Base de datos lista');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

initDB();
