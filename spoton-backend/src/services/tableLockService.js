// ============================================================
// TABLE LOCK SERVICE — Two-Stage Locking via Redis (UC-C11)
// Giai đoạn 1: Holding (TTL 10 phút) - Khách chọn bàn, chọn menu
// Giai đoạn 2: Pending Payment (TTL 15 phút) - Khách thanh toán VNPay/MoMo
// ============================================================
const redis = require('../config/redis');

const TABLE_LOCK_PREFIX = 'table_lock'; // Full key: spoton:table_lock:{branchId}:{tableId}
const HOLD_TTL = 600;    // 10 phút (Giai đoạn 1)
const PAYMENT_TTL = 900; // 15 phút (Giai đoạn 2)

class TableLockService {
  /**
   * Tạo key lock cho bàn (Lưu ý: Redis class tự động thêm prefix spoton:)
   * @returns {string} Ví dụ: table_lock:64abc123:64def456
   */
  static _buildKey(branchId, tableId) {
    return `${TABLE_LOCK_PREFIX}:${branchId}:${tableId}`;
  }

  /**
   * Giai đoạn 1: Khóa bàn khi khách chọn trên sơ đồ (TTL 10 phút)
   * Lệnh Redis: SET table_lock_{branch}_{table} {customerId} EX 600 NX
   */
  static async lockTable(branchId, tableId, customerId) {
    if (redis.status !== 'ready') {
      console.warn('⚠️ Redis is not ready. Bypassing lockTable.');
      return true;
    }
    try {
      const key = this._buildKey(branchId, tableId);
      const result = await redis.set(key, customerId, 'EX', HOLD_TTL, 'NX');
      return result === 'OK';
    } catch (error) {
      console.warn(`⚠️ Redis error in lockTable: ${error.message}. Bypassing.`);
      return true;
    }
  }

  /**
   * Khóa nhiều bàn cùng lúc (Atomic — All or Nothing)
   * Sử dụng Lua Script để đảm bảo tính nguyên tử 100% không bị Context Switch
   */
  static async lockMultipleTables(branchId, tableIds, customerId) {
    if (redis.status !== 'ready') {
      console.warn('⚠️ Redis is not ready. Bypassing lockMultipleTables.');
      return { success: true };
    }
    
    // Tạo danh sách keys
    const keys = tableIds.map(id => this._buildKey(branchId, id));
    
    // Lua script: 
    // - Vòng lặp 1: Kiểm tra xem có bất kỳ key nào đã tồn tại chưa (bàn đã bị khóa chưa)
    // - Nếu có, trả về key đó ngay lập tức (thất bại).
    // - Nếu không có key nào tồn tại, lặp lại và SET tất cả với TTL (thành công).
    const luaScript = `
      for i = 1, #KEYS do
        if redis.call("EXISTS", KEYS[i]) == 1 then
          return KEYS[i]
        end
      end
      for i = 1, #KEYS do
        redis.call("SET", KEYS[i], ARGV[1], "EX", tonumber(ARGV[2]))
      end
      return "OK"
    `;

    try {
      const result = await redis.eval(luaScript, keys.length, ...keys, customerId, HOLD_TTL);
      if (result === 'OK') {
        return { success: true };
      } else {
        // Trả về failedTableId dựa trên key bị trùng
        const failedTableId = result.split(':').pop();
        return { success: false, failedTableId };
      }
    } catch (error) {
      console.warn(`⚠️ Redis error in Lua lockMultipleTables: ${error.message}`);
      return { success: false };
    }
  }

  /**
   * Giai đoạn 2: Gia hạn khóa lên 15 phút khi khách bấm "Thanh toán"
   */
  static async extendLockForPayment(branchId, tableIds) {
    if (redis.status !== 'ready') return true;
    
    try {
      // Dùng pipeline hoặc Lua script đều được, ở đây dùng for loop cho nhanh 
      // vì lúc này bàn ĐÃ thuộc về khách (đã khóa ở phase 1)
      for (const tableId of tableIds) {
        const key = this._buildKey(branchId, tableId);
        const exists = await redis.exists(key);
        if (!exists) {
          return false; // Lock đã hết hạn trước khi khách kịp thanh toán
        }
        await redis.expire(key, PAYMENT_TTL);
      }
      return true;
    } catch (error) {
      console.warn(`⚠️ Redis error in extendLockForPayment: ${error.message}. Bypassing.`);
      return true;
    }
  }

  /**
   * Giải phóng khóa bàn (Khi thanh toán thành công hoặc hủy đơn)
   */
  static async unlockTables(branchId, tableIds) {
    if (redis.status !== 'ready') return;
    try {
      const pipeline = redis.pipeline();
      for (const tableId of tableIds) {
        pipeline.del(this._buildKey(branchId, tableId));
      }
      await pipeline.exec();
    } catch (error) {
      console.warn(`⚠️ Redis error in unlockTables: ${error.message}`);
    }
  }

  static async getTableLockOwner(branchId, tableId) {
    if (redis.status !== 'ready') return null;
    try {
      return await redis.get(this._buildKey(branchId, tableId));
    } catch (error) {
      return null;
    }
  }

  static async getTableLockTTL(branchId, tableId) {
    if (redis.status !== 'ready') return -2;
    try {
      return await redis.ttl(this._buildKey(branchId, tableId));
    } catch (error) {
      return -2;
    }
  }
}

module.exports = TableLockService;
