/**
 * Script tạo tài khoản Admin để test API Menu (UC-7.3)
 * Chạy: node src/test-create-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const User = require('./models/User');

async function createAdmin() {
  await connectDB();

  const email = 'admin@spoton.vn';
  const password = 'Admin@123';

  // Check if admin already exists
  let admin = await User.findOne({ email });

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  if (!admin) {
    admin = await User.create({
      full_name: 'SpotOn Admin',
      email,
      password_hash,
      role: 'ADMIN',
      auth_provider: 'LOCAL',
      is_email_verified: true,
    });
    console.log('✅ Admin user created:', admin.email);
  } else {
    // Update password and ensure verified
    admin.password_hash = password_hash;
    admin.role = 'ADMIN';
    admin.is_email_verified = true;
    await admin.save();
    console.log('✅ Admin user updated:', admin.email);
  }

  // Generate token
  const token = jwt.sign(
    { userId: admin._id, role: admin.role },
    process.env.JWT_SECRET || 'spoton_default_secret',
    { expiresIn: '7d' }
  );

  console.log('\n🔑 Admin JWT Token (use for API testing):');
  console.log(token);
  console.log('\nTest with:');
  console.log(`Invoke-RestMethod -Uri "http://localhost:5000/api/v1/menus/master" -Method GET -Headers @{Authorization="Bearer ${token}"} | ConvertTo-Json -Depth 5`);

  await mongoose.disconnect();
}

createAdmin();
