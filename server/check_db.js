const db = require('./config/db');

async function checkUsers() {
  try {
    const [rows] = await db.query('SELECT username, role FROM users');
    console.log('Users in DB:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  }
}

checkUsers();
