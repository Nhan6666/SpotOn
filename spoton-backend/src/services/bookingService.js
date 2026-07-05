const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Branch = require('../models/Branch');

class BookingService {
  // Logic dùng chung: Quy đổi giờ và tìm Ca làm việc
  static async validateAndGetShift(branchId, timeStr) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      const err = new Error('Chi nhánh không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    const [h, m] = timeStr.split(':').map(Number);
    const targetMinutes = h * 60 + m;
    const { lunch, dinner } = branch.service_periods || {};

    let shift = null;
    let shiftEnd = null;

    const checkShift = (period, shiftName) => {
      if (period && period.start && period.end) {
        const [sh, sm] = period.start.split(':').map(Number);
        const [eh, em] = period.end.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        if (targetMinutes >= startMins && targetMinutes <= endMins) {
          shift = shiftName;
          shiftEnd = endMins;
        }
      }
    };

    checkShift(lunch, 'LUNCH');
    if (!shift) checkShift(dinner, 'DINNER');

    if (!shift) {
      const err = new Error('Thời gian chọn không nằm trong ca hoạt động của nhà hàng.');
      err.statusCode = 400;
      throw err;
    }
    
    // Rule: Cannot book if within 2 hours of closing time (120 minutes)
    if (shiftEnd - targetMinutes < 120) {
      const err = new Error('Giờ đến phải cách giờ đóng cửa ca ít nhất 2 tiếng.');
      err.statusCode = 400;
      throw err;
    }

    return shift;
  }

  static async holdBookingSafe(payload, userId) {
    const { branch_id, date, time, table_ids, guest_count } = payload;
    
    // 1. Validate Business Logic
    const shift = await this.validateAndGetShift(branch_id, time);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // 2. Bắt đầu MongoDB Transaction để chống Race Condition
    // Lưu ý: Transaction CHỈ hoạt động trên Replica Set (MongoDB Atlas). 
    // Nếu chạy Local standalone sẽ lỗi. 
    // Tuy nhiên SpotOn đã dùng Atlas nên sẽ chạy được.
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Tìm xem có bàn nào đang bận không (Phải pass session vào)
      const conflictingBookings = await Booking.find({
        branch_id,
        shift,
        reservation_date: { $gte: targetDate, $lt: nextDate },
        table_ids: { $in: table_ids },
        $or: [
          { status: { $in: ['PENDING_PAYMENT', 'PENDING_DEPOSIT', 'CONFIRMED', 'OCCUPIED', 'RESERVED'] } },
          { status: 'HOLDING', expires_at: { $gt: new Date() } }
        ]
      }).session(session);

      if (conflictingBookings.length > 0) {
        const err = new Error('Có bàn đã được khách khác chọn. Vui lòng chọn bàn khác.');
        err.statusCode = 409;
        throw err;
      }

      // Tạo booking nháp trong Transaction
      const [newBooking] = await Booking.create([{
        branch_id,
        customer_id: userId || null,
        reservation_date: date,
        arrival_time: time,
        shift,
        guest_count: guest_count || 1,
        table_ids,
        status: 'HOLDING',
        expires_at: new Date(Date.now() + 10 * 60000)
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return newBooking;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = BookingService;
