const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Branch = require('../models/Branch');
const TableLockService = require('./tableLockService');

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

    // 2. Khóa bàn trên Redis (Giai đoạn 1 — TTL 10 phút)
    const customerId = userId ? userId.toString() : `guest_${Date.now()}`;
    const lockResult = await TableLockService.lockMultipleTables(branch_id, table_ids, customerId);

    if (!lockResult.success) {
      const err = new Error(`Bàn đã bị khách khác giữ chỗ. Vui lòng chọn bàn khác.`);
      err.statusCode = 409;
      throw err;
    }

    // 3. Bắt đầu MongoDB Transaction để chống Race Condition
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Tìm xem có bàn nào đang bận trong DB không (Double-check)
      const conflictingBookings = await Booking.find({
        branch_id,
        shift,
        reservation_date: { $gte: targetDate, $lt: nextDate },
        table_ids: { $in: table_ids },
        $or: [
          { status: { $in: ['PENDING_PAYMENT', 'CONFIRMED', 'IN_USE'] } },
          { status: 'HOLDING', expires_at: { $gt: new Date() } }
        ]
      }).session(session);

      if (conflictingBookings.length > 0) {
        // Rollback Redis lock
        await TableLockService.unlockTables(branch_id, table_ids);
        const err = new Error('Có bàn đã được khách khác chọn. Vui lòng chọn bàn khác.');
        err.statusCode = 409;
        throw err;
      }

      // Lấy tên bàn để lưu vào assigned_tables cho KDS, Runner dùng
      const branch = await Branch.findById(branch_id).session(session);
      const assigned_tables = [];
      if (branch && branch.zones) {
        branch.zones.forEach(zone => {
          zone.tables.forEach(t => {
            if (table_ids.includes(t._id.toString())) {
              assigned_tables.push({ table_id: t._id, table_number: t.table_number });
            }
          });
        });
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
        assigned_tables,
        status: 'HOLDING',
        expires_at: new Date(Date.now() + 10 * 60000)
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return newBooking;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      // Rollback Redis nếu DB transaction fail
      await TableLockService.unlockTables(branch_id, table_ids);
      throw error;
    }
  }
  static async addAdditionalOrder(bookingId, items, user) {
    if (!items || items.length === 0) {
      const err = new Error('Không có món ăn nào.');
      err.statusCode = 400;
      throw err;
    }

    if (user.role === 'IPAD' && String(user._id) !== String(bookingId)) {
      const err = new Error('iPad này không có quyền gọi món cho bàn khác.');
      err.statusCode = 403;
      throw err;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        const err = new Error('Không tìm thấy booking.');
        err.statusCode = 404;
        throw err;
      }

      if (booking.status !== 'IN_USE') {
        const err = new Error('Chỉ có thể gọi thêm món khi bàn đang sử dụng.');
        err.statusCode = 400;
        throw err;
      }

      let totalAdditionalAmount = 0;
      const Menu = require('../models/Menu');

      const menuItemIds = items.map(i => i.menu_item_id);
      const menus = await Menu.find({ "items._id": { $in: menuItemIds } }).session(session);

      const menuMap = new Map();
      menus.forEach(menu => {
        menu.items.forEach(item => {
          menuMap.set(item._id.toString(), { menu, item });
        });
      });

      for (const item of items) {
        const data = menuMap.get(item.menu_item_id);
        if (!data) {
          const err = new Error(`Món ${item.name} không tồn tại trong hệ thống.`);
          err.statusCode = 400;
          throw err;
        }

        const { menu, item: menuItem } = data;

        if (menu.branch_id === null) {
          const override = menuItem.branch_overrides.find(o => String(o.branch_id) === String(booking.branch_id));
          if (override && override.quantity !== -1) {
            if (override.quantity < item.quantity) {
              const err = new Error(`Món ${item.name} chỉ còn ${override.quantity} phần.`);
              err.statusCode = 400;
              throw err;
            }
            await Menu.updateOne(
              { "items._id": item.menu_item_id, "items.branch_overrides.branch_id": booking.branch_id },
              { $inc: { "items.$[itm].branch_overrides.$[ovr].quantity": -item.quantity } },
              { arrayFilters: [{ "itm._id": item.menu_item_id }, { "ovr.branch_id": booking.branch_id }], session }
            );
          }
        } else {
          if (menuItem.quantity !== undefined && menuItem.quantity !== -1) {
            if (menuItem.quantity < item.quantity) {
              const err = new Error(`Món ${item.name} chỉ còn ${menuItem.quantity} phần.`);
              err.statusCode = 400;
              throw err;
            }
            await Menu.updateOne(
              { "items._id": item.menu_item_id },
              { $inc: { "items.$[itm].quantity": -item.quantity } },
              { arrayFilters: [{ "itm._id": item.menu_item_id }], session }
            );
          }
        }

        totalAdditionalAmount += item.price * item.quantity;
      }

      const newItems = items.map(item => ({
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        price_at_time: item.price,
        type: 'ADDITIONAL',
        prep_status: 'PENDING'
      }));

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          $push: { order_items: { $each: newItems } },
          $inc: { final_bill_amount: totalAdditionalAmount }
        },
        { new: true, session }
      );

      await session.commitTransaction();
      session.endSession();

      return { updatedBooking, newItems };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  static async checkInBooking(bookingId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findById(bookingId)
        .populate('customer_id', 'full_name')
        .session(session);

      if (!booking) {
        const err = new Error('Không tìm thấy đơn đặt bàn.');
        err.statusCode = 404;
        throw err;
      }

      if (booking.status !== 'CONFIRMED') {
        const err = new Error('Đơn đặt bàn phải ở trạng thái Đã xác nhận (CONFIRMED) mới có thể Check-in.');
        err.statusCode = 400;
        throw err;
      }

      // 1. Cập nhật Booking -> IN_USE
      booking.status = 'IN_USE';
      await booking.save({ session });

      // 2. Cập nhật các Bàn thành OCCUPIED
      if (booking.table_ids && booking.table_ids.length > 0) {
        await Branch.updateOne(
          { _id: booking.branch_id },
          { $set: { 'zones.$[].tables.$[tbl].status': 'OCCUPIED' } },
          { 
            arrayFilters: [{ 'tbl._id': { $in: booking.table_ids } }],
            session 
          }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return booking;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  static async checkoutBooking(bookingId, finalBillAmount) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findById(bookingId)
        .populate('customer_id', 'full_name')
        .session(session);

      if (!booking) {
        const err = new Error('Không tìm thấy đơn đặt bàn.');
        err.statusCode = 404;
        throw err;
      }

      if (booking.status !== 'IN_USE') {
        const err = new Error('Chỉ có thể thanh toán khi khách đang sử dụng (IN_USE).');
        err.statusCode = 400;
        throw err;
      }

      booking.status = 'COMPLETED';
      if (finalBillAmount !== undefined) {
        booking.final_bill_amount = finalBillAmount;
      }

      // NẾU CÓ VOUCHER -> ĐÁNH DẤU LÀ ĐÃ DÙNG
      if (booking.applied_voucher_code) {
        const Voucher = require('../models/Voucher');
        const UserVoucher = require('../models/UserVoucher');

        const voucher = await Voucher.findOne({ code: booking.applied_voucher_code }).session(session);
        if (voucher) {
          // Tăng lượt dùng của Voucher gốc
          voucher.used_count += 1;
          await voucher.save({ session });

          // Cập nhật UserVoucher (nếu có lưu trong ví)
          if (booking.customer_id) {
            await UserVoucher.updateOne(
              { 
                customer_id: booking.customer_id._id || booking.customer_id, 
                voucher_id: voucher._id,
                status: 'UNUSED'
              },
              { 
                $set: { 
                  status: 'USED', 
                  used_at: new Date(), 
                  used_in_booking: booking._id 
                } 
              },
              { session }
            );
          }
        }
      }

      await booking.save({ session });

      if (booking.table_ids && booking.table_ids.length > 0) {
        await Branch.updateOne(
          { _id: booking.branch_id },
          { $set: { 'zones.$[].tables.$[tbl].status': 'EMPTY' } },
          { 
            arrayFilters: [{ 'tbl._id': { $in: booking.table_ids } }],
            session 
          }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return booking;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  static async createWalkInBooking(payload, branchId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { table_ids, assigned_tables, guest_count, note } = payload;
      
      if (!table_ids || table_ids.length === 0) {
        const err = new Error('Vui lòng chọn ít nhất 1 bàn.');
        err.statusCode = 400;
        throw err;
      }

      const now = new Date();
      const currentHour = now.getHours();
      const shift = (currentHour >= 10 && currentHour < 15) ? 'LUNCH' : 'DINNER';
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Lấy tên bàn từ DB
      let final_assigned_tables = assigned_tables;
      if (!final_assigned_tables || final_assigned_tables.length === 0) {
        final_assigned_tables = [];
        const branch = await Branch.findById(branchId).session(session);
        if (branch && branch.zones) {
          branch.zones.forEach(zone => {
            zone.tables.forEach(t => {
              if (table_ids.includes(t._id.toString())) {
                final_assigned_tables.push({ table_id: t._id, table_number: t.table_number });
              }
            });
          });
        }
      }

      // 1. Tạo Booking
      const booking = new Booking({
        branch_id: branchId,
        walk_in_name: 'Khách vãng lai',
        reservation_date: now,
        arrival_time: timeStr,
        shift,
        guest_count: guest_count || 2,
        status: 'IN_USE',
        note: note || '',
        table_ids,
        assigned_tables: final_assigned_tables
      });

      await booking.save({ session });

      // 2. Cập nhật trạng thái bàn -> OCCUPIED
      await Branch.updateOne(
        { _id: branchId },
        { $set: { 'zones.$[].tables.$[tbl].status': 'OCCUPIED' } },
        { 
          arrayFilters: [{ 'tbl._id': { $in: table_ids } }],
          session 
        }
      );

      await session.commitTransaction();
      session.endSession();

      return booking;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = BookingService;
