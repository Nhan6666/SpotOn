const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Menu = require('../models/Menu');
const fs = require('fs');

// Load env vars
dotenv.config({ path: '../.env' }); 

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spoton_db';

const rawData = JSON.parse(fs.readFileSync(__dirname + '/menu_data.json', 'utf8'));

const categories = {
  'Combo (Phù Hợp Nhóm)': [],
  'Hải Sản': [],
  'Món Bò, Gà, Heo': [],
  'Lẩu & Nướng': [],
  'Khai Vị & Ăn Nhẹ': [],
  'Đồ Uống & Khác': []
};

rawData.forEach(item => {
  const parts = item.text.split('\n');
  if (parts.length >= 2) {
    const name = parts[0].trim();
    const priceStr = parts[1].replace(/\D/g, '');
    const price = parseInt(priceStr) || 0;
    
    if (price > 0 && name.length > 0) {
      const dbItem = {
        name,
        description: '',
        base_price: price,
        price: price,
        is_core_item: true,
        image_url: item.src
      };
      
      const lowerName = name.toLowerCase();
      if (lowerName.includes('combo')) {
        categories['Combo (Phù Hợp Nhóm)'].push(dbItem);
      } else if (lowerName.includes('lẩu') || lowerName.includes('nướng')) {
        categories['Lẩu & Nướng'].push(dbItem);
      } else if (lowerName.includes('mực') || lowerName.includes('tôm') || lowerName.includes('cá') || lowerName.includes('hàu') || lowerName.includes('ngao') || lowerName.includes('bạch tuộc') || lowerName.includes('ốc')) {
        categories['Hải Sản'].push(dbItem);
      } else if (lowerName.includes('bò') || lowerName.includes('gà') || lowerName.includes('heo') || lowerName.includes('bê') || lowerName.includes('sụn') || lowerName.includes('dạ dày') || lowerName.includes('ếch')) {
        categories['Món Bò, Gà, Heo'].push(dbItem);
      } else if (lowerName.includes('đậu') || lowerName.includes('khoai') || lowerName.includes('salad') || lowerName.includes('nộm') || lowerName.includes('rau') || lowerName.includes('ngô') || lowerName.includes('lạc') || lowerName.includes('dưa') || lowerName.includes('ngồng')) {
        categories['Khai Vị & Ăn Nhẹ'].push(dbItem);
      } else {
        categories['Đồ Uống & Khác'].push(dbItem);
      }
    }
  }
});

const seedData = Object.keys(categories)
  .filter(catName => categories[catName].length > 0)
  .map(catName => ({
    category_name: catName,
    branch_id: null,
    items: categories[catName]
  }));

const seedMenus = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Database...');

    await Menu.deleteMany({ branch_id: null });
    console.log('Cleared old Master Menus!');

    await Menu.insertMany(seedData);
    let totalItems = 0;
    seedData.forEach(c => totalItems += c.items.length);
    console.log(`Successfully seeded ${seedData.length} categories with ${totalItems} dishes!`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding menus:', error);
    process.exit(1);
  }
};

seedMenus();
