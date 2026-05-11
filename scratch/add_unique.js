const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../server/.env' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.query('ALTER TABLE staff ADD UNIQUE (staff_name)');
    console.log('Unique constraint added successfully');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

run();
