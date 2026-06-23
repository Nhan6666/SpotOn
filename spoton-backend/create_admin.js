require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

async function createAdmin() {
  await connectDB();
  const email = 'admin@spoton.vn';
  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    console.log(`Tài khoản Admin đã tồn tại: ${email} | Mật khẩu: Spoton@123`);
  } else {
    const passwordHash = await bcrypt.hash('Spoton@123', 10);
    await User.create({
      email,
      password_hash: passwordHash,
      full_name: 'Super Admin',
      phone: '0901000001',
      role: 'ADMIN',
      is_email_verified: true,
    });
    console.log(`Đã tạo thành công tài khoản Admin mới: ${email} | Mật khẩu: Spoton@123`);
  }
  process.exit(0);
}

createAdmin().catch(console.error);
