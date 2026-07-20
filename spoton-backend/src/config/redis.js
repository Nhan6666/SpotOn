// ============================================================
// REDIS CONNECTION — Two-Stage Table Locking (UC-C11)
// Sử dụng Redis tại localhost:6379
// ============================================================
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  keyPrefix: 'spoton:', // Prefix tránh xung đột với app khác trên cùng Redis
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Redis: Không thể kết nối sau 3 lần thử.');
      return null; // Dừng retry
    }
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully (spoton prefix)');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

module.exports = redis;
