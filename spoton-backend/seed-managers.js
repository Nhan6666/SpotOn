const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const seedManagers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cluster0.mongodb.net/spoton');
    console.log('MongoDB connected.');

    const password_hash = await bcrypt.hash('123456', 10);

    const managers = [
      {
        full_name: 'Quản lý Chi nhánh 1',
        email: 'manager1@spoton.vn',
        password_hash,
        role: 'MANAGER',
        phone: '0901234567'
      },
      {
        full_name: 'Quản lý Chi nhánh 2',
        email: 'manager2@spoton.vn',
        password_hash,
        role: 'MANAGER',
        phone: '0901234568'
      },
      {
        full_name: 'Quản lý Dự phòng',
        email: 'manager3@spoton.vn',
        password_hash,
        role: 'MANAGER',
        phone: '0901234569'
      }
    ];

    for (const data of managers) {
      const exists = await User.findOne({ email: data.email });
      if (!exists) {
        await User.create(data);
        console.log(`Đã tạo Quản lý: ${data.email}`);
      } else {
        console.log(`Đã tồn tại: ${data.email}`);
      }
    }

    console.log('Hoàn tất thêm dữ liệu Quản lý!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedManagers();
