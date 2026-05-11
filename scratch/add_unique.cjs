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
    // Check if column exists first (to be safe)
    await connection.query('ALTER TABLE staff ADD UNIQUE (staff_name)');
    console.log('Unique constraint added successfully');
  } catch (err) {
    if (err.message.includes('Duplicate')) {
        console.log('Unique constraint already exists');
    } else {
        console.error('Error:', err.message);
    }
  } finally {
    await connection.end();
  }
}

run();
