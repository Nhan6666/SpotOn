const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Menu = require('../models/Menu');

// Load env vars
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Make sure this points to your root .env

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spoton_db';

const seedData = [
  {
    category_name: 'Combo (Phù Hợp Nhóm)',
    branch_id: null,
    items: [
      {
        name: 'Combo Nhậu Tự Do 1 (Cho 4-5 người)',
        description: 'Bê thui, dồi sụn nướng, nộm sứa, khoai tây chiên, 5 lon bia Tự Do',
        base_price: 699000,
        price: 699000,
        is_core_item: true,
        image_url: 'https://images.unsplash.com/photo-1544025162-811114cd354c?w=600&auto=format&fit=crop&q=60'
      },
      {
        name: 'Combo Lẩu Thái Hải Sản (Cho 4-5 người)',
        description: 'Nước lẩu Thái chua cay, tôm sú, mực ống, ngao, ba chỉ bò, rau tổng hợp',
        base_price: 599000,
        price: 599000,
        is_core_item: true,
        image_url: 'https://images.unsplash.com/photo-1626804475297-41609ea004eb?w=600&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    category_name: 'Món Bò & Bê',
    branch_id: null,
    items: [
      {
        name: 'Bê Thui Cháy Tỏi',
        description: 'Bê thui mềm ngọt, xào lăn cháy tỏi siêu thơm',
        base_price: 189000,
        price: 189000,
        is_core_item: true,
        image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&auto=format&fit=crop&q=60'
      },
      {
        name: 'Bò Tơ Nướng Tảng',
        description: 'Bò tơ tươi nướng nguyên tảng trên than hoa, thái tại bàn',
        base_price: 249000,
        price: 249000,
        is_core_item: true,
        image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=60'
      },
      {
        name: 'Gân Kiệu Huế',
        description: 'Gân bò giòn sần sật ngâm chua ngọt cùng củ kiệu đặc sản Huế',
        base_price: 149000,
        price: 149000,
        is_core_item: false,
        image_url: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    category_name: 'Món Hải Sản',
    branch_id: null,
    items: [
      {
        name: 'Tôm Sú Ủ Muối Thảo Mộc',
        description: 'Tôm sú to, ngọt thịt ủ cùng muối hột và thảo mộc thơm lừng',
        base_price: 249000,
        price: 249000,
        is_core_item: true,
        image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=60'
      },
      {
        name: 'Mực Sụn Chiên Bơ Tỏi',
        description: 'Mực sụn giòn, chiên bơ tỏi ngậy thơm',
        base_price: 199000,
        price: 199000,
        is_core_item: false,
        image_url: 'https://images.unsplash.com/photo-1599487405270-b07cd5f9dc16?w=600&auto=format&fit=crop&q=60'
      },
      {
        name: 'Cá Lóc Nướng Trui',
        description: 'Đặc sản cá lóc nướng trui cuốn bánh tráng rau rừng',
        base_price: 289000,
        price: 289000,
        is_core_item: true,
        image_url: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    category_name: 'Khai Vị & Ăn Nhẹ',
    branch_id: null,
    items: [
      {
        name: 'Gỏi Chân Gà Trộn Thính',
        description: 'Chân gà rút xương bóp gỏi thính giòn giòn chua ngọt',
        base_price: 119000,
        price: 119000,
        is_core_item: false,
        image_url: 'https://storage.quannhautudo.com/data/thumb_400/Data/images/product/2026/06/202606131600373324.webp'
      },
      {
        name: 'Gỏi Heo Nướng Trộn Thính',
        description: 'Thịt heo nướng thái mỏng trộn thính đậm đà',
        base_price: 169000,
        price: 169000,
        is_core_item: true,
        image_url: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=60'
      },
      {
        name: 'Khoai Lệ Phố Chiên Giòn',
        description: 'Khoai lệ phố chiên xù rắc vừng',
        base_price: 69000,
        price: 69000,
        is_core_item: false,
        image_url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=60'
      }
    ]
  },
  {
    category_name: 'Lẩu',
    branch_id: null,
    items: [
      {
        name: 'Lẩu Cua Đồng Ba Bắp',
        description: 'Lẩu cua đồng chuẩn vị Bắc với bắp bò sụn ngon',
        base_price: 499000,
        price: 499000,
        is_core_item: true,
        image_url: 'https://images.unsplash.com/photo-1605807646983-377bc5a7644e?w=600&auto=format&fit=crop&q=60'
      },
      {
        name: 'Lẩu Chim Câu Nấm Quý',
        description: 'Chim bồ câu tiềm với nấm đông cô, đông trùng hạ thảo bổ dưỡng',
        base_price: 559000,
        price: 559000,
        is_core_item: true,
        image_url: 'https://images.unsplash.com/photo-1548943487-a2e4f43bb2bb?w=600&auto=format&fit=crop&q=60'
      }
    ]
  }
];

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

    for (let category of seedData) {
      for (let item of category.items) {
        if (item.image_url) {
          try {
            let name = item.name;
            name = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            const publicId = `${name}_${Date.now()}`;
            
            const result = await cloudinary.uploader.upload(item.image_url, {
              folder: 'SpotOn/menu',
              public_id: publicId
            });
            item.image_url = result.secure_url;
            console.log(`[OK] Uploaded: ${item.name}`);
          } catch (err) {
            console.error(`[ERROR] Failed to upload ${item.name}:`, err);
          }
        }
      }
    }

    // Clear existing Master Menus (branch_id = null)
    await Menu.deleteMany({ branch_id: null });
    console.log('Cleared old Master Menus!');

    // Insert new seeded menus
    await Menu.insertMany(seedData);
    console.log(`Successfully seeded ${seedData.length} menu categories with dishes!`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding menus:', error);
    process.exit(1);
  }
};

seedMenus();
