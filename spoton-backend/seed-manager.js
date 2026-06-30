const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/spoton_db';

async function seedManager() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');

    const email = 'manager@spoton.vn';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Manager already exists!');
    } else {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('123456', salt);

      const manager = await User.create({
        email,
        password_hash,
        full_name: 'Nguyen Van Quan Ly',
        role: 'MANAGER',
        phone: '0901234567',
        is_email_verified: true
      });
      console.log('Manager created:', manager.email);
    }
    
    // update a second manager for testing if needed
    const email2 = 'manager2@spoton.vn';
    const existing2 = await User.findOne({ email: email2 });
    if (!existing2) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('123456', salt);
      await User.create({
        email: email2,
        password_hash,
        full_name: 'Tran Thi Quan Ly 2',
        role: 'MANAGER',
        phone: '0901234568',
        is_email_verified: true
      });
      console.log('Manager 2 created:', email2);
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

seedManager();
