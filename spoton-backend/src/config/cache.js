// ============================================================
// IN-MEMORY CACHE — Two-Stage Table Locking (UC-C11)
// Sử dụng node-cache thay cho Redis, không cần Docker
// ============================================================
const NodeCache = require('node-cache');

// stdTTL = 0 means no default TTL, we set TTL per key manually
// checkperiod: kiểm tra key hết hạn mỗi 60 giây
const cache = new NodeCache({
  stdTTL: 0,
  checkperiod: 60,
  useClones: false, // Tăng hiệu suất, không clone object khi get/set
});

cache.on('set', (key) => {
  // Chỉ log lần đầu khởi tạo cache (optional debug)
});

cache.on('expired', (key, value) => {
  console.log(`🔓 Cache key expired: ${key}`);
});

console.log('✅ NodeCache initialized successfully (in-memory, no Redis needed)');

module.exports = cache;
