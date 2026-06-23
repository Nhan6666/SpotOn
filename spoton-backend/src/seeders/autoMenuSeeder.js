const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Menu = require('../models/Menu');
const fs = require('fs');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') }); 

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
      } else if (lowerName.includes('mực') || lowerName.includes('tôm') || lowerName.includes('cá') || lowerName.includes('hàu') || lowerName.includes('ngao') || lowerName.includes('bạch tuộc') || lowerName.includes('ốc') || lowerName.includes('ba ba')) {
        categories['Hải Sản'].push(dbItem);
      } else if (lowerName.includes('bò') || lowerName.includes('gà') || lowerName.includes('heo') || lowerName.includes('bê') || lowerName.includes('sụn') || lowerName.includes('dạ dày') || lowerName.includes('ếch') || lowerName.includes('trâu') || lowerName.includes('lợn') || lowerName.includes('dê')) {
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

    // Cloudinary config
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log('Uploading images to Cloudinary, please wait...');

    const formatStr = (str) => {
      if (!str) return 'unknown';
      return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    };

    for (let category of seedData) {
      for (let item of category.items) {
        if (item.image_url) {
          try {
            let cat = formatStr(category.category_name);
            let name = formatStr(item.name);
            const publicId = `img_${Date.now()}`;
            
            const result = await cloudinary.uploader.upload(item.image_url, {
              folder: `SpotOn/menu/${cat}/${name}`,
              public_id: publicId
            });
            item.image_url = result.secure_url;
            console.log(`[OK] Uploaded: ${item.name}`);
          } catch (err) {
            console.error(`[ERROR] Failed to upload ${item.name}:`, err.message);
          }
        }
      }
    }

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
