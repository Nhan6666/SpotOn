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
   * Tạo key lock cho bàn
   * @returns {string} Ví dụ: table_lock:64abc123:64def456
   */
  static _buildKey(branchId, tableId) {
    return `${TABLE_LOCK_PREFIX}:${branchId}:${tableId}`;
  }

  /**
   * Giai đoạn 1: Khóa bàn khi khách chọn trên sơ đồ (TTL 10 phút)
   * Lệnh Redis: SET table_lock_{branch}_{table} {customerId} EX 600 NX
   * NX = chỉ set nếu key chưa tồn tại (tránh ghi đè lock của người khác)
   * 
   * @param {string} branchId
   * @param {string} tableId
   * @param {string} customerId - ID người giữ bàn
   * @returns {boolean} true nếu khóa thành công, false nếu bàn đã bị giữ
   */
  static async lockTable(branchId, tableId, customerId) {
    const key = this._buildKey(branchId, tableId);
    // SET key value EX ttl NX → Trả về 'OK' nếu thành công, null nếu key đã tồn tại
    const result = await redis.set(key, customerId, 'EX', HOLD_TTL, 'NX');
    return result === 'OK';
  }

  /**
   * Khóa nhiều bàn cùng lúc (Atomic — All or Nothing)
   * Nếu 1 trong các bàn đã bị lock → Rollback tất cả
   * 
   * @param {string} branchId
   * @param {string[]} tableIds
   * @param {string} customerId
   * @returns {{ success: boolean, failedTableId?: string }}
   */
  static async lockMultipleTables(branchId, tableIds, customerId) {
    const lockedKeys = [];

    for (const tableId of tableIds) {
      const success = await this.lockTable(branchId, tableId, customerId);
      if (!success) {
        // Rollback: Xóa tất cả các key đã lock thành công trước đó
        for (const lockedKey of lockedKeys) {
          await redis.del(lockedKey);
        }
        return { success: false, failedTableId: tableId };
      }
      lockedKeys.push(this._buildKey(branchId, tableId));
    }

    return { success: true };
  }

  /**
   * Giai đoạn 2: Gia hạn khóa lên 15 phút khi khách bấm "Thanh toán"
   * Lệnh Redis: EXPIRE table_lock_{branch}_{table} 900
   * 
   * @param {string} branchId
   * @param {string[]} tableIds
   * @returns {boolean}
   */
  static async extendLockForPayment(branchId, tableIds) {
    for (const tableId of tableIds) {
      const key = this._buildKey(branchId, tableId);
      const exists = await redis.exists(key);
      if (!exists) {
        return false; // Lock đã hết hạn trước khi khách kịp thanh toán
      }
      await redis.expire(key, PAYMENT_TTL);
    }
    return true;
  }

  /**
   * Giải phóng khóa bàn (Khi thanh toán thành công hoặc hủy đơn)
   * Lệnh Redis: DEL table_lock_{branch}_{table}
   * 
   * @param {string} branchId
   * @param {string[]} tableIds
   */
  static async unlockTables(branchId, tableIds) {
    const pipeline = redis.pipeline();
    for (const tableId of tableIds) {
      pipeline.del(this._buildKey(branchId, tableId));
    }
    await pipeline.exec();
  }

  /**
   * Kiểm tra bàn có đang bị khóa không
   * @returns {string|null} customerId nếu đang bị lock, null nếu trống
   */
  static async getTableLockOwner(branchId, tableId) {
    const key = this._buildKey(branchId, tableId);
    return await redis.get(key);
  }

  /**
   * Lấy thời gian còn lại của lock (giây)
   * @returns {number} Số giây còn lại, -2 nếu key không tồn tại
   */
  static async getTableLockTTL(branchId, tableId) {
    const key = this._buildKey(branchId, tableId);
    return await redis.ttl(key);
  }
}

module.exports = TableLockService;
