import bcrypt from 'bcryptjs';

async function check() {
  const adminHash = await bcrypt.hash('admin', 10);
  const staffHash = await bcrypt.hash('staff@kochi.metro', 10);
  console.log('admin hash:', adminHash);
  console.log('staff hash:', staffHash);
}

check();
