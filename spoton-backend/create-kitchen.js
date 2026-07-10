require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Branch = require('./src/models/Branch');

const createKitchenAccount = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const branch = await Branch.findOne();
    if (!branch) {
      console.log('No branch found to assign to kitchen staff');
      process.exit(1);
    }

    const email = 'bep@spoton.vn';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Kitchen account already exists:', email);
      process.exit(0);
    }

    const password_hash = await bcrypt.hash('password123', 10);
    const kitchenStaff = new User({
      email,
      password_hash,
      full_name: 'Trưởng Bếp',
      role: 'KITCHEN',
      branch_id: branch._id
    });

    await kitchenStaff.save();
    console.log('Successfully created kitchen account:');
    console.log('Email:', email);
    console.log('Password: password123');
    console.log('Branch ID:', branch._id);

    process.exit(0);
  } catch (error) {
    console.error('Error creating kitchen account:', error);
    process.exit(1);
  }
};

createKitchenAccount();
