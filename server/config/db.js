const mysql2 = require('mysql2');
require('dotenv').config();

const pool = mysql2.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'kochi_metro_db',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  charset:            'utf8mb4',
});

// Verify connection on startup
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅  MySQL connected successfully');
  conn.release();
});

module.exports = pool.promise();
