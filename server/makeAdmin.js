const { Sequelize } = require('sequelize');
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
        dialect: 'postgres'
      }
    );

async function makeAdmin(email) {
  try {
    await sequelize.authenticate();
    const [result] = await sequelize.query(
      "UPDATE usuarios SET rol = 'admin' WHERE email = :email RETURNING email, rol",
      { replacements: { email }, type: sequelize.QueryTypes.UPDATE }
    );
    if (result.length > 0) {
      console.log(`Usuario ${result[0].email} ahora es admin`);
    } else {
      console.log('Usuario no encontrado');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Uso: node makeAdmin.js <email>');
  process.exit(1);
}

makeAdmin(email);
