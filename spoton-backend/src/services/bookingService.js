const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Branch = require('../models/Branch');
const User = require('../models/User'); // Required for populate('customer_id')
const TableLockService = require('./tableLockService');

class BookingService {
  static isTimeOverlap(time1, time2, durationMins = 120) {
    if (!time1 || !time2) return false;
    const [h1, m1] = time1.split(':').map(Number);
    const start1 = h1 * 60 + m1;
    const end1 = start1 + durationMins;

    const [h2, m2] = time2.split(':').map(Number);
    const start2 = h2 * 60 + m2;
    const end2 = start2 + durationMins;

    return Math.max(start1, start2) < Math.min(end1, end2);
  }

  // Logic dùng chung: Quy đổi giờ và tìm Ca làm việc
  static async validateAndGetShift(branchId, timeStr) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      const err = new Error('Chi nhánh không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    const [h, m] = timeStr.split(':').map(Number);
    const originalTargetMinutes = h * 60 + m;
    const { lunch, dinner } = branch.service_periods || {};

    let shift = null;
    let shiftEnd = null;
    let targetMinutes = originalTargetMinutes;

    const checkShift = (period, shiftName) => {
      if (period && period.start && period.end) {
        const [sh, sm] = period.start.split(':').map(Number);
        const [eh, em] = period.end.split(':').map(Number);
        const startMins = sh * 60 + sm;
        let endMins = eh * 60 + em;
        let tMins = originalTargetMinutes;
        
        if (endMins < startMins) endMins += 24 * 60;
        if (tMins < startMins && endMins > 24 * 60) tMins += 24 * 60;

        if (tMins >= startMins && tMins <= endMins) {
          shift = shiftName;
          shiftEnd = endMins;
          targetMinutes = tMins;
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
      // Tìm xem có bàn nào đang bận trong DB không (Double-check) dựa trên Time-slot (120 phút)
      const activeBookings = await Booking.find({
        branch_id,
        reservation_date: { $gte: targetDate, $lt: nextDate },
        table_ids: { $in: table_ids },
        $or: [
          { status: { $in: ['PENDING_PAYMENT', 'CONFIRMED', 'IN_USE'] } },
          { status: 'HOLDING', expires_at: { $gt: new Date() } }
        ]
      }).session(session);

      // Lọc các booking bị chồng lấp thời gian
      const conflictingBookings = activeBookings.filter(b => this.isTimeOverlap(b.arrival_time, time));

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

  // Phương thức dùng chung để đồng bộ Kho nguyên liệu (Tăng/Giảm quantity)
  static async syncInventory(items, branchId, isDeduct, session) {
    if (!items || items.length === 0) return;
    const Menu = require('../models/Menu');
    
    // Lấy tất cả menu của các items
    const menuItemIds = items.map(i => i.menu_item_id);
    const menus = await Menu.find({ "items._id": { $in: menuItemIds } }).session(session);
    
    const menuMap = new Map();
    menus.forEach(menu => {
      menu.items.forEach(item => {
        menuMap.set(item._id.toString(), { menu, item });
      });
    });

    for (const item of items) {
      const data = menuMap.get(item.menu_item_id?.toString());
      if (!data) continue;
      const { menu, item: menuItem } = data;
      const change = isDeduct ? -item.quantity : item.quantity;
      
      if (menu.branch_id === null) {
        // Master Menu -> Trừ ở branch_overrides
        const override = menuItem.branch_overrides.find(o => String(o.branch_id) === String(branchId));
        if (override && override.quantity !== -1) {
          await Menu.updateOne(
            { "items._id": item.menu_item_id, "items.branch_overrides.branch_id": branchId },
            { $inc: { "items.$[itm].branch_overrides.$[ovr].quantity": change } },
            { arrayFilters: [{ "itm._id": item.menu_item_id }, { "ovr.branch_id": branchId }], session }
          );
        }
      } else {
        // Branch Menu -> Trừ thẳng quantity
        if (menuItem.quantity !== undefined && menuItem.quantity !== -1) {
          await Menu.updateOne(
            { "items._id": item.menu_item_id },
            { $inc: { "items.$[itm].quantity": change } },
            { arrayFilters: [{ "itm._id": item.menu_item_id }], session }
          );
        }
      }
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
  static async checkoutBooking(bookingId, checkoutData = {}) {
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

      if (!['IN_USE', 'PENDING_SETTLEMENT'].includes(booking.status)) {
        const err = new Error('Chỉ có thể thanh toán khi đang phục vụ hoặc chờ đối soát.');
        err.statusCode = 400;
        throw err;
      }

      // KIỂM TRA TOÀN BỘ MÓN ĐÃ SERVED (Bao gồm order online và gọi tại bàn)
      const hasUnservedItems = booking.order_items && booking.order_items.some(item => item.prep_status !== 'SERVED');
      if (hasUnservedItems) {
        const err = new Error('Không thể thanh toán. Bàn này vẫn còn món chưa phục vụ xong (Chưa bưng món).');
        err.statusCode = 400;
        throw err;
      }

      // === CHUẨN HÓA TÀI CHÍNH ===
      const items = booking.order_items || [];
      const calculatedTotal = items.reduce((acc, item) => acc + (item.price_at_time * item.quantity), 0);
      const grossTotal = calculatedTotal > 0 ? calculatedTotal : (booking.pre_order_total_amount || 0);
      const adjustmentsTotal = (booking.bill_adjustments || []).reduce((sum, adj) => sum + (adj.amount || 0), 0);
      const voucherDiscount = booking.voucher_discount_amount || 0;
      const depositPaid = booking.total_deposit_paid || 0;
      const amountCollected = Math.max(0, grossTotal - voucherDiscount - adjustmentsTotal - depositPaid);

      booking.status = 'COMPLETED';
      booking.final_bill_amount = grossTotal - voucherDiscount - adjustmentsTotal; // Tổng bill sau điều chỉnh (GROSS)
      booking.amount_collected = amountCollected; // Số tiền thực thu tại quầy (NET)

      // NẾU CÓ VOUCHER -> ĐÁNH DẤU LÀ ĐÃ DÙNG
      const actualVoucherCode = booking.applied_voucher_code || (booking.payment_info && booking.payment_info.voucher_code);
      if (actualVoucherCode) {
        const Voucher = require('../models/Voucher');
        const UserVoucher = require('../models/UserVoucher');

        const voucher = await Voucher.findOne({ code: actualVoucherCode }).session(session);
        if (voucher) {
          // Tăng lượt dùng của Voucher gốc
          voucher.used_count += 1;
          await voucher.save({ session });

          // Cập nhật UserVoucher (nếu có lưu trong ví VÀ là private voucher)
          if (!voucher.is_public) {
            let customerIdToUpdate = booking.customer_id?._id || booking.customer_id;
            if (!customerIdToUpdate && booking.walk_in_phone) {
              const User = require('../models/User');
              const user = await User.findOne({ phone: booking.walk_in_phone }).session(session);
              if (user) {
                customerIdToUpdate = user._id;
              }
            }

            if (customerIdToUpdate) {
              await UserVoucher.updateOne(
                { 
                  customer_id: customerIdToUpdate, 
                  voucher_id: voucher._id
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
      }

      await booking.save({ session });

      // Ghi nhận doanh thu (Revenue)
      const Revenue = require('../models/Revenue');
      await Revenue.create([{
        branch_id: booking.branch_id,
        booking_id: booking._id,
        date: new Date(),
        shift: booking.shift || 'LUNCH',
        amount: booking.final_bill_amount,
        pre_order_total: booking.pre_order_total_amount || 0,
        deposit_paid: depositPaid,
        voucher_discount: voucherDiscount,
        adjustments_total: adjustmentsTotal,
        final_paid_at_checkout: amountCollected,
        status: 'COMPLETED'
      }], { session });

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
      console.error('Lỗi chi tiết trong BookingService.checkoutBooking:', error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  static async forceReleaseBooking(bookingId) {
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
        const err = new Error('Chỉ có thể nhả bàn khi trạng thái là IN_USE.');
        err.statusCode = 400;
        throw err;
      }

      booking.status = 'PENDING_SETTLEMENT';

      // Xử lý món ăn (Force Serve) để không bị kẹt luồng Checkout
      let hasForceServedItems = false;
      if (booking.order_items && booking.order_items.length > 0) {
        booking.order_items.forEach(item => {
          if (item.prep_status !== 'SERVED') {
            item.prep_status = 'SERVED';
            hasForceServedItems = true;
          }
        });
      }

      // Thêm log/ghi chú nếu có món bị ép hoàn thành
      if (hasForceServedItems) {
        booking.note = booking.note ? `${booking.note}\n[Hệ thống]: Đã tự động chuyển các món chưa lên thành ĐÃ PHỤC VỤ do thao tác Nhả bàn.` : `[Hệ thống]: Đã tự động chuyển các món chưa lên thành ĐÃ PHỤC VỤ do thao tác Nhả bàn.`;
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

  static async addBillAdjustment(bookingId, adjustmentData, userId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err = new Error('Không tìm thấy đơn đặt bàn.');
      err.statusCode = 404;
      throw err;
    }

    if (!['IN_USE', 'PENDING_SETTLEMENT'].includes(booking.status)) {
      const err = new Error('Chỉ có thể thêm điều chỉnh khi đang phục vụ hoặc chờ đối soát.');
      err.statusCode = 400;
      throw err;
    }

    booking.bill_adjustments.push({
      ...adjustmentData,
      actor_id: userId
    });

    await booking.save();
    return booking;
  }

  static async removeBillAdjustment(bookingId, adjustmentId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err = new Error('Không tìm thấy đơn đặt bàn.');
      err.statusCode = 404;
      throw err;
    }

    if (!['IN_USE', 'PENDING_SETTLEMENT'].includes(booking.status)) {
      const err = new Error('Chỉ có thể xóa điều chỉnh khi đang phục vụ hoặc chờ đối soát.');
      err.statusCode = 400;
      throw err;
    }

    booking.bill_adjustments = booking.bill_adjustments.filter(adj => adj._id.toString() !== adjustmentId.toString());
    await booking.save();
    return booking;
  }

  static async processRefund(bookingId, refundData, userId) {
    const { refund_amount, reason, refund_proof_url } = refundData;

    if (!refund_amount || refund_amount <= 0) {
      const err = new Error('Số tiền hoàn phải lớn hơn 0.');
      err.statusCode = 400;
      throw err;
    }
    if (!reason || !reason.trim()) {
      const err = new Error('Lý do hoàn tiền là bắt buộc.');
      err.statusCode = 400;
      throw err;
    }
    if (!refund_proof_url) {
      const err = new Error('Vui lòng upload ảnh chứng từ hoàn tiền.');
      err.statusCode = 400;
      throw err;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findById(bookingId)
        .populate('customer_id', 'full_name phone')
        .session(session);

      if (!booking) {
        const err = new Error('Không tìm thấy đơn đặt bàn.');
        err.statusCode = 404;
        throw err;
      }

      if (!['COMPLETED', 'PENDING_SETTLEMENT', 'CANCELLED_REFUND_PENDING'].includes(booking.status)) {
        const err = new Error('Chỉ có thể hoàn tiền cho đơn đã hoàn thành, chờ đối soát hoặc hủy chờ hoàn tiền.');
        err.statusCode = 400;
        throw err;
      }

      // ============================================================
      // KIẾN TRÚC TÀI CHÍNH: Tính trần hoàn tiền theo loại đơn
      // - CANCELLED_REFUND_PENDING: Khách chỉ mới đóng cọc, chưa checkout
      //   → maxRefundable = total_deposit_paid (tiền cọc đã thu)
      // - COMPLETED / PENDING_SETTLEMENT: Khách đã ăn xong, đã thanh toán
      //   → maxRefundable = total_deposit_paid + amount_collected (tổng tiền đã thu)
      // ============================================================
      const maxRefundable = booking.status === 'CANCELLED_REFUND_PENDING'
        ? (booking.total_deposit_paid || 0)
        : (booking.total_deposit_paid || 0) + (booking.amount_collected || 0);

      // Nếu đơn đang chờ hoàn tiền do khách hủy bàn, thì refund_amount trong DB đang là "số tiền khách YÊU CẦU hoàn", chứ chưa phải tiền ĐÃ HOÀN.
      const existingRefund = booking.status === 'REFUND_COMPLETED' ? (booking.refund_info?.refund_amount || 0) : 0;
      
      if (maxRefundable > 0 && refund_amount > maxRefundable - existingRefund) {
        const err = new Error(`Số tiền hoàn (${refund_amount.toLocaleString()}đ) vượt quá số tiền có thể hoàn (${(maxRefundable - existingRefund).toLocaleString()}đ).`);
        err.statusCode = 400;
        throw err;
      }

      // Cập nhật refund_info
      booking.refund_info = {
        refund_amount: refund_amount,
        refund_percentage: maxRefundable > 0 ? Math.round((refund_amount / maxRefundable) * 100) : 100,
        refund_proof_url: refund_proof_url,
        refund_completed_at: new Date(),
      };

      // Cập nhật trạng thái booking
      if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED_REFUND_PENDING') {
        booking.status = 'REFUND_COMPLETED';
      }
      booking.cancellation_reason = `REFUND: ${reason} (Bởi Manager ID: ${userId})`;

      await booking.save({ session });

      // Trừ doanh thu: Tạo Revenue entry âm
      const Revenue = require('../models/Revenue');
      await Revenue.create([{
        branch_id: booking.branch_id,
        booking_id: booking._id,
        date: new Date(),
        shift: booking.shift || 'LUNCH',
        amount: -refund_amount,
        pre_order_total: 0,
        deposit_paid: 0,
        voucher_discount: 0,
        adjustments_total: 0,
        final_paid_at_checkout: -refund_amount,
        status: 'REFUNDED'
      }], { session });

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
