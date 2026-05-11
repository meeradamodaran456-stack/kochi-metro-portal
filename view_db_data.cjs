const mysql = require('mysql2/promise');

async function viewData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'kochi_metro_db'
    });

    console.log('\nConnected to database!\n');

    const [departments] = await connection.execute(
      'SELECT * FROM departments'
    );

    const [staff] = await connection.execute(
      'SELECT * FROM staff'
    );

    console.log('Departments:');
    console.table(departments);

    console.log('\nStaff:');
    console.table(staff);

    await connection.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

viewData();