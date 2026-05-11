const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'server/.env' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Create departments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE
      )
    `);

    // Insert existing departments from staff table
    await connection.query(`
      INSERT IGNORE INTO departments (name)
      SELECT DISTINCT department FROM staff WHERE department != ''
    `);

    // If no departments, add defaults
    await connection.query(`
      INSERT IGNORE INTO departments (name) VALUES ('IT'), ('HR'), ('Finance'), ('Operations')
    `);

    console.log('Departments table created and seeded');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

run();
