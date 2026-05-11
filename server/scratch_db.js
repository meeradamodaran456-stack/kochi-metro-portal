const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE
      )
    `);
    await connection.query(`
      INSERT IGNORE INTO departments (name)
      SELECT DISTINCT department FROM staff WHERE department != ''
    `);
    console.log('Departments table ready');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
