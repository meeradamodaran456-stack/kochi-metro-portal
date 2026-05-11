const db = require('./config/db');

async function migrate() {
  console.log('🚀  Running auto-migration...');
  try {
    // ── Create USERS table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff') DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── Create DEPARTMENTS table
    await db.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── Create STAFF table
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_name VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        designation VARCHAR(255),
        extension_no VARCHAR(50),
        did VARCHAR(50),
        direct_number VARCHAR(50),
        mobile_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_staff_name (staff_name)
      )
    `);

    // ── Seed default accounts
    const [admin] = await db.query('SELECT * FROM users WHERE username = ?', ['admin@kochi.metro']);
    if (admin.length === 0) {
      await db.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [
        'admin@kochi.metro',
        '$2a$10$XXDNF59Qxu7.lDPZqhXNpuQSJ96nRgJYsU/oKu2A0anjbihCgweAG', // password: admin
        'admin'
      ]);
      console.log('✅  Admin account created');
    }

    const [staffUser] = await db.query('SELECT * FROM users WHERE username = ?', ['staff@kochi.metro']);
    if (staffUser.length === 0) {
      await db.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [
        'staff@kochi.metro',
        '$2a$10$5b42DsEHL4gjtleKsG4WxOc.jNyn3oycRdLGwizJxGFNYAVEzeoli', // password: staff@kochi.metro
        'staff'
      ]);
      console.log('✅  Staff account created');
    }

    console.log('✅  Auto-migration complete');
  } catch (err) {
    console.error('❌  Migration failed:', err.message);
  }
}

module.exports = migrate;
