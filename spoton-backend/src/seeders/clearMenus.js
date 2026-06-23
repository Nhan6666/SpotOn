const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Menu = require('../models/Menu');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spoton_db';

const clearMenus = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Database...');
    
    // Xóa toàn bộ dữ liệu trong collection Menus
    const result = await Menu.deleteMany({});
    
    console.log(`✅ Đã xóa thành công ${result.deletedCount} danh mục menu khỏi cơ sở dữ liệu!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi xóa menu:', error);
    process.exit(1);
  }
};

clearMenus();
