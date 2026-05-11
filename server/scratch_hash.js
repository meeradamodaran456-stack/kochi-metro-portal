const bcrypt = require('bcryptjs');

async function verify() {
  const adminHashInSql = '$2a$10$XXDNF59Qxu7.lDPZqhXNpuQSJ96nRgJYsU/oKu2A0anjbihCgweAG';
  const staffHashInSql = '$2a$10$5b42DsEHL4gjt1eKsG4WxOc.jNyn3oycRdLGwizJxGfNYAVEzeo1i';

  const adminValid = await bcrypt.compare('admin', adminHashInSql);
  const staffValid = await bcrypt.compare('staff@kochi.metro', staffHashInSql);

  console.log('Is "admin" hash valid for "admin"?', adminValid);
  console.log('Is "staff@kochi.metro" hash valid for "staff@kochi.metro"?', staffValid);
}

verify();
