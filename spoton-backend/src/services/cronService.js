// ============================================================
// CRON SERVICE — System Workers (UC-S01 + UC-S02)
// UC-S01: Auto-Unlock bàn khi PENDING_PAYMENT quá 15 phút
// UC-S02: Auto-Cancel No-Show khi CONFIRMED quá 30 phút
// ============================================================
const Booking = require('../models/Booking');
const TableLockService = require('./tableLockService');

class CronService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Khởi chạy Cronjob (gọi từ server.js)
   * Quét mỗi 60 giây
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('⏰ CronService started — Scanning every 60 seconds');

    // Chạy ngay lần đầu
    this._runAll();

    // Lặp lại mỗi 60 giây
    this.intervalId = setInterval(() => {
      this._runAll();
    }, 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log('⏰ CronService stopped');
    }
  }

  async _runAll() {
    try {
      await this._autoUnlockExpiredPayments();
      await this._autoCancelNoShow();
      await this._autoSweepEndShift();
    } catch (error) {
      console.error('❌ CronService error:', error.message);
    }
  }

  /**
   * UC-S01: Quét PENDING_PAYMENT quá hạn (expires_at < now)
   * → Chuyển thành CANCELLED_TIMEOUT, nhả bàn Redis + WebSocket
   */
  async _autoUnlockExpiredPayments() {
    const expiredBookings = await Booking.find({
      status: 'PENDING_PAYMENT',
      expires_at: { $lt: new Date() },
    });

    for (const booking of expiredBookings) {
      await Booking.updateOne(
        { _id: booking._id },
        {
          $set: {
            status: 'CANCELLED_TIMEOUT',
            'payment_info.status': 'FAILED'
          },
          $unset: { expires_at: "" }
        }
      );

      // Nhả Redis lock (nếu còn)
      await TableLockService.unlockTables(
        booking.branch_id.toString(),
        booking.table_ids.map(id => id.toString())
      );

      // WebSocket thông báo nhả bàn
      try {
        const io = require('../socket').getIO();
        io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
          action: 'CANCELLED_TIMEOUT',
          branch_id: booking.branch_id,
          booking_id: booking._id,
          table_ids: booking.table_ids,
        });
      } catch (e) {
        // Socket chưa khởi tạo (edge case khi test)
      }

      console.log(`⏰ UC-S01: Booking ${booking._id} → CANCELLED_TIMEOUT (quá hạn thanh toán)`);
    }

    // Đồng thời quét HOLDING quá hạn (10 phút)
    const expiredHoldings = await Booking.find({
      status: 'HOLDING',
      expires_at: { $lt: new Date() },
    });

    for (const booking of expiredHoldings) {
      await Booking.updateOne(
        { _id: booking._id },
        {
          $set: { status: 'CANCELLED_TIMEOUT' },
          $unset: { expires_at: "" }
        }
      );

      await TableLockService.unlockTables(
        booking.branch_id.toString(),
        booking.table_ids.map(id => id.toString())
      );

      try {
        const io = require('../socket').getIO();
        io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
          action: 'CANCELLED_TIMEOUT',
          branch_id: booking.branch_id,
          booking_id: booking._id,
          table_ids: booking.table_ids,
        });
      } catch (e) {}

      console.log(`⏰ UC-S01: Holding ${booking._id} → CANCELLED_TIMEOUT (quá hạn giữ bàn)`);
    }
  }

  /**
   * UC-S02: Quét CONFIRMED quá giờ check-in 30 phút
   * → Chuyển thành NO_SHOW, mất cọc 100%, nhả bàn
   */
  async _autoCancelNoShow() {
    const now = new Date();
    // Chỉ quét các booking đã được xác nhận và có giờ đặt trong quá khứ
    const confirmedBookings = await Booking.find({
      status: 'CONFIRMED',
      reservation_date: { $lte: now }
    });

    for (const booking of confirmedBookings) {
      // Tính thời điểm hẹn đến (reservation_date + arrival_time)
      const reservationDate = new Date(booking.reservation_date);
      const [hours, minutes] = (booking.arrival_time || '00:00').split(':').map(Number);
      reservationDate.setHours(hours, minutes, 0, 0);

      // Grace Period: 30 phút
      const graceDeadline = new Date(reservationDate.getTime() + 30 * 60000);

      if (now > graceDeadline) {
        // Khách bị phạt mất cọc 100% (không cần làm gì thêm, tiền đã thu)
        await Booking.updateOne(
          { _id: booking._id },
          { $set: { status: 'NO_SHOW' } }
        );

        // Nhả bàn
        await TableLockService.unlockTables(
          booking.branch_id.toString(),
          booking.table_ids.map(id => id.toString())
        );

        try {
          const io = require('../socket').getIO();
          io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
            action: 'NO_SHOW',
            branch_id: booking.branch_id,
            booking_id: booking._id,
            table_ids: booking.table_ids,
          });
        } catch (e) {}

        console.log(`⏰ UC-S02: Booking ${booking._id} → NO_SHOW (quá giờ check-in 30 phút)`);
      }
    }
  }

  /**
   * UC-S03: Auto-sweep cuối ca (Chuyển bàn quên checkout sang PENDING_SETTLEMENT)
   * Quét các bàn IN_USE quá 5 tiếng (300 phút)
   */
  async _autoSweepEndShift() {
    const cutoffTime = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
    const stuckBookings = await Booking.find({
      status: 'IN_USE',
      updated_at: { $lt: cutoffTime }
    });

    for (const booking of stuckBookings) {
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { status: 'PENDING_SETTLEMENT' } }
      );

      // Giải phóng trạng thái bàn trong Branch
      if (booking.table_ids && booking.table_ids.length > 0) {
        const Branch = require('../models/Branch');
        await Branch.updateOne(
          { _id: booking.branch_id },
          { $set: { 'zones.$[].tables.$[tbl].status': 'EMPTY' } },
          { arrayFilters: [{ 'tbl._id': { $in: booking.table_ids } }] }
        );
      }

      try {
        const io = require('../socket').getIO();
        io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
          action: 'FORCE_RELEASED', // Giống hành động manager tự nhả bàn
          branch_id: booking.branch_id,
          booking_id: booking._id,
          table_ids: booking.table_ids,
        });
        io.to(`branch_${booking.branch_id}`).emit('BOOKING_STATUS_CHANGED', {
          bookingId: booking._id,
          status: 'PENDING_SETTLEMENT'
        });
      } catch (e) {}

      console.log(`⏰ UC-S03: Booking ${booking._id} → PENDING_SETTLEMENT (Auto-sweep cuối ca sau 5 giờ)`);
    }
  }
}

module.exports = new CronService();
