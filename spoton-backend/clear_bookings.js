require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Branch = require('./src/models/Branch');
const redis = require('./src/config/redis');

async function clearAllBookings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Xóa toàn bộ dữ liệu trong collection Bookings
    const result = await Booking.deleteMany({});
    console.log(`🗑️ Đã xóa thành công ${result.deletedCount} đơn đặt bàn trong database.`);

    // 2. Cập nhật lại toàn bộ Bàn về trạng thái EMPTY (trừ bàn đang bảo trì)
    const branches = await Branch.find({});
    let tablesResetCount = 0;
    
    for (const branch of branches) {
      let isModified = false;
      if (branch.zones) {
        branch.zones.forEach(zone => {
          if (zone.tables) {
            zone.tables.forEach(table => {
              // Bỏ qua bàn đang bảo trì
              if (table.status !== 'EMPTY' && table.status !== 'MAINTENANCE') {
                table.status = 'EMPTY';
                isModified = true;
                tablesResetCount++;
              }
            });
          }
        });
      }
      
      if (isModified) {
        await branch.save();
      }
    }
    console.log(`🔄 Đã reset trạng thái ${tablesResetCount} bàn về EMPTY (Trống).`);

    // 3. Xóa các khóa bàn (table locks) đang giữ trong Redis Cache
    try {
      const keys = await redis.keys('*lock:table*');
      if (keys.length > 0) {
        // ioredis keys() trả về key có chứa prefix nếu scan, hoặc del() tự add prefix
        // Nếu dùng redis.del thì truyền mảng key nguyên bản (chưa prefix, hoặc có prefix tuỳ ioredis config)
        await redis.del(...keys);
        console.log(`🧹 Đã dọn dẹp ${keys.length} khóa giữ bàn trong bộ nhớ tạm Redis.`);
      }
    } catch (redisErr) {
      console.log('⚠️ Không thể dọn dẹp Redis (có thể không có khóa nào):', redisErr.message);
    }

    console.log('🎉 Đã hoàn tất dọn dẹp toàn bộ dữ liệu đặt bàn!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

clearAllBookings();
