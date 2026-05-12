const db = require('./server/config/db');

async function reset() {
  console.log('🧹 Clearing all data from Railway database...');
  try {
    // Disable foreign key checks temporarily if needed
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Clear tables
    await db.query('TRUNCATE TABLE staff');
    await db.query('TRUNCATE TABLE departments');
    
    // Re-enable foreign key checks
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅  Database is now CLEAN and EMPTY!');
    process.exit(0);
  } catch (err) {
    console.error('❌  Reset failed:', err.message);
    process.exit(1);
  }
}

reset();
