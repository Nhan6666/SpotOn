// ============================================================
// BOOKING CONTROLLER
// Xử lý: Tạo booking, xem danh sách, cập nhật trạng thái
// ============================================================
const Booking = require('../models/Booking');
const Branch = require('../models/Branch');
// const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');

// Helper function
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// @desc   Tạo booking mới (có tài khoản hoặc walk-in)
// @route  POST /api/v1/bookings
// @access Private
const createBooking = async (req, res) => {
  try {
    const bookingData = { ...req.body };

    // TÍNH NĂNG BẢO MẬT: Nếu là Customer tự đặt, ép cứng customer_id là ID của họ (tránh giả mạo truyền ID người khác lên)
    if (req.user && req.user.role === 'CUSTOMER') {
      bookingData.customer_id = req.user._id;
    }

    // Tự động gán branch_id hiện tại nếu Manager/Waiter tạo đơn cho khách walk-in
    if (req.user && ['MANAGER', 'WAITER'].includes(req.user.role)) {
      bookingData.branch_id = req.user.branch_id;
    }

    const branch = await Branch.findById(bookingData.branch_id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    // UC-6.1: Check if branch is FULL or CLOSED
    if (branch.status === 'FULL') {
      return res.status(400).json({ success: false, message: 'Chi nhánh hiện đang quá tải (Full). Vui lòng chọn chi nhánh khác hoặc thử lại sau.' });
    }
    if (branch.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Chi nhánh hiện đang đóng cửa.' });
    }

    // Xóa đơn HOLDING cũ trùng lặp trên cùng bàn (do quá trình chọn bàn tạo ra trước khi chốt đơn)
    if (bookingData.table_ids && bookingData.table_ids.length > 0) {
      const targetDate = new Date(bookingData.reservation_date);
      targetDate.setHours(0,0,0,0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      let holdQuery = {
        branch_id: bookingData.branch_id,
        table_ids: { $in: bookingData.table_ids },
        status: 'HOLDING',
        reservation_date: { $gte: targetDate, $lt: nextDate }
      };

      // Khách hàng chỉ được xóa hold của chính họ. Nhân viên được xóa hold bất kỳ để đè đơn mới.
      if (req.user.role === 'CUSTOMER') {
        holdQuery.customer_id = req.user._id;
      }

      const oldHoldings = await Booking.find(holdQuery);
      for (const holding of oldHoldings) {
        await Booking.findByIdAndDelete(holding._id);
        const TableLockService = require('../services/tableLockService');
        await TableLockService.unlockTables(bookingData.branch_id.toString(), holding.table_ids.map(id => id.toString()));
      }
    }

    const newBooking = await Booking.create(bookingData);

    // UC-6.1: Check capacity and trigger overload alert
    if (branch.manager_id && branch.overload_threshold) {
      // Calculate total capacity
      const totalCapacity = branch.zones
        .filter(z => z.status === 'OPEN')
        .reduce((sum, zone) => sum + (zone.capacity || 0), 0);

      if (totalCapacity > 0) {
        // Find active bookings today for this branch
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeBookings = await Booking.find({
          branch_id: branch._id,
          booking_date: { $gte: today, $lt: tomorrow },
          status: { $in: ['PENDING', 'CONFIRMED', 'SEATED'] }
        });

        const currentGuests = activeBookings.reduce((sum, b) => sum + (b.guest_count || 0), 0);
        const currentCapacityPercent = (currentGuests / totalCapacity) * 100;

        if (currentCapacityPercent >= branch.overload_threshold) {
          // Check if an alert was already sent recently to avoid spam (e.g. in the last hour)
          /*
          const recentAlert = await Notification.findOne({
            user_id: branch.manager_id,
            type: 'OVERLOAD_ALERT',
            created_at: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
          });
          */

          /*
          if (!recentAlert) {
            await Notification.create({
              user_id: branch.manager_id,
              type: 'OVERLOAD_ALERT',
              title: 'Cảnh báo quá tải chi nhánh!',
              content: `Chi nhánh ${branch.name} đang đạt mức công suất ${currentCapacityPercent.toFixed(1)}% (vượt ngưỡng ${branch.overload_threshold}%). Vui lòng kiểm tra và xử lý!`
            });
            console.log(`[UC-6.1] Overload alert sent to manager of branch ${branch.name}`);
          }
          */
        }
      }
    }

    res.status(201).json({ 
      success: true, 
      message: 'Tạo đơn đặt bàn thành công.',
      data: newBooking 
    });
  } catch (error) {
    console.error('Lỗi createBooking:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Lấy tất cả bookings (Admin/Manager/Waiter)
// @route  GET /api/v1/bookings
// @access Private
const getAllBookings = async (req, res) => {
  try {
    let filter = {};

    // TÍNH NĂNG PHÂN QUYỀN (Tenant-based Access): 
    // Manager, Waiter và Kitchen chỉ được lấy danh sách đơn của chi nhánh mình làm việc
    if (['MANAGER', 'WAITER', 'KITCHEN'].includes(req.user.role)) {
      filter.branch_id = req.user.branch_id;
    }

    if (req.query.branch_id && req.user.role === 'ADMIN') {
      filter.branch_id = req.query.branch_id;
    }

    if (req.query.start_date && req.query.end_date) {
      if (req.query.include_refund_pending === 'true') {
        filter.$or = [
          { 
            reservation_date: {
              $gte: new Date(req.query.start_date),
              $lt: new Date(req.query.end_date)
            } 
          },
          { status: 'CANCELLED_REFUND_PENDING' }
        ];
      } else {
        filter.reservation_date = {
          $gte: new Date(req.query.start_date),
          $lt: new Date(req.query.end_date)
        };
      }
    }

    const bookings = await Booking.find(filter)
      .populate('customer_id', 'full_name email phone')
      .sort({ created_at: -1 }); // Sắp xếp đơn mới nhất lên đầu

    res.status(200).json({ 
      success: true, 
      message: 'Lấy danh sách đơn đặt bàn toàn hệ thống thành công.',
      data: bookings 
    });
  } catch (error) {
    console.error('Lỗi getAllBookings:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Lấy booking theo ID
// @route  GET /api/v1/bookings/:id
// @access Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer_id', 'full_name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt bàn.' });
    }

    // TÍNH NĂNG BẢO MẬT VÒNG TRONG:
    // 1. Nếu là Khách, phải là người tạo đơn mới được xem (trừ khi đơn này không có customer_id - tức khách vãng lai)
    if (req.user && req.user.role === 'CUSTOMER') {
      if (booking.customer_id) {
        if (String(booking.customer_id?._id || booking.customer_id) !== String(req.user._id)) {
          return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn đặt bàn này.' });
        }
      }
    } 
    // 2. Nếu là Nhân sự chi nhánh, chỉ xem được đơn của chi nhánh mình
    else if (req.user && ['MANAGER', 'WAITER'].includes(req.user.role)) {
      if (String(booking.branch_id) !== String(req.user.branch_id)) {
        return res.status(403).json({ success: false, message: 'Đơn đặt bàn này không thuộc chi nhánh của bạn.' });
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Lấy chi tiết đơn đặt bàn thành công.',
      data: booking 
    });
  } catch (error) {
    console.error('Lỗi getBookingById:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Lấy danh sách đơn đặt bàn của khách hàng đang login
// @route  GET /api/v1/bookings/my-bookings
// @access Private (CUSTOMER)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer_id: req.user._id })
      .populate('branch_id', 'name address')
      .sort({ created_at: -1 });

    res.status(200).json({ 
      success: true, 
      message: 'Lấy danh sách đơn đặt bàn của bạn thành công.',
      data: bookings 
    });
  } catch (error) {
    console.error('Lỗi getMyBookings:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật trạng thái booking (CONFIRMED, CANCELLED, COMPLETED...)
// @route  PATCH /api/v1/bookings/:id/status
// @access Private (ADMIN, MANAGER)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt bàn.' });
    }

    // BẢO MẬT: Manager chỉ được đổi trạng thái đơn của chi nhánh mình
    if (req.user.role === 'MANAGER' && String(booking.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên đơn của chi nhánh khác.' });
    }

    // STATE MACHINE VALIDATION
    const VALID_TRANSITIONS = {
      HOLDING: ['PENDING_PAYMENT', 'CANCELLED', 'CANCELLED_TIMEOUT'],
      PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED', 'CANCELLED_TIMEOUT'],
      CONFIRMED: ['IN_USE', 'CANCELLED', 'NO_SHOW'],
      IN_USE: ['COMPLETED', 'PENDING_SETTLEMENT'],
      COMPLETED: ['REFUND_COMPLETED'],
      CANCELLED: [],
      CANCELLED_TIMEOUT: [],
      CANCELLED_REFUND_PENDING: ['REFUND_COMPLETED'],
      REFUND_COMPLETED: [],
      NO_SHOW: [],
      PENDING_SETTLEMENT: ['COMPLETED', 'WRITE_OFF'],
      WRITE_OFF: []
    };

    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ ${booking.status} sang ${status}.`
      });
    }

    const oldStatus = booking.status;
    booking.status = status;
    
    // === XỬ LÝ TỒN KHO MÓN ĂN (INVENTORY) ===
    const BookingService = require('../services/bookingService');
    
    // 1. Trừ kho khi đơn chốt thành công (CONFIRMED)
    if (oldStatus === 'PENDING_PAYMENT' && status === 'CONFIRMED') {
      if (booking.order_items && booking.order_items.length > 0) {
        await BookingService.syncInventory(booking.order_items, booking.branch_id, true);
      }
    }
    
    // 2. Hoàn kho khi Hủy bàn
    if (['CANCELLED', 'CANCELLED_TIMEOUT'].includes(status) && !['CANCELLED', 'CANCELLED_TIMEOUT'].includes(oldStatus)) {
      if (booking.order_items && booking.order_items.length > 0) {
        // Chỉ hoàn kho những món chưa nấu (PENDING)
        const pendingItems = booking.order_items.filter(item => item.prep_status === 'PENDING');
        if (pendingItems.length > 0) {
          await BookingService.syncInventory(pendingItems, booking.branch_id, false);
        }
      }
    }
    // Đồng bộ trạng thái bàn vật lý trong Branch
    if (booking.table_ids && booking.table_ids.length > 0) {
      if (['CANCELLED', 'CANCELLED_TIMEOUT', 'NO_SHOW', 'COMPLETED'].includes(status)) {
        // Hủy hoặc Xong -> Nhả bàn
        const TableLockService = require('../services/tableLockService');
        await TableLockService.unlockTables(
          booking.branch_id.toString(),
          booking.table_ids.map(id => id.toString())
        );
      } else if (status === 'IN_USE') {
        // Đang dùng bữa -> Đỏ (OCCUPIED)
        const Branch = require('../models/Branch');
        await Branch.updateOne(
          { _id: booking.branch_id },
          { $set: { 'zones.$[].tables.$[tbl].status': 'OCCUPIED' } },
          { arrayFilters: [{ 'tbl._id': { $in: booking.table_ids } }] }
        );
      } else if (status === 'CONFIRMED') {
        // Đã xác nhận -> Vàng (RESERVED)
        const Branch = require('../models/Branch');
        await Branch.updateOne(
          { _id: booking.branch_id },
          { $set: { 'zones.$[].tables.$[tbl].status': 'RESERVED' } },
          { arrayFilters: [{ 'tbl._id': { $in: booking.table_ids } }] }
        );
      }
    }

    await booking.save();

    // Phát event qua WebSocket để cập nhật Real-time (User & Manager & Waiter)
    const io = require('../socket').getIO();
    io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
      action: status,
      branch_id: booking.branch_id,
      booking_id: booking._id,
      table_ids: booking.table_ids
    });

    res.status(200).json({ 
      success: true, 
      message: `Đã cập nhật trạng thái đơn thành ${status}.`,
      data: booking 
    });
  } catch (error) {
    console.error('Lỗi updateBookingStatus:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};



// @desc   Cập nhật thông tin đơn hàng và chốt món
// @route  PUT /api/v1/bookings/:id/update-info
// @access Public/Private
const updateBookingInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_items, notes, note, meal_type, walk_in_name, walk_in_phone } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt bàn.' });
    }

    if (walk_in_name !== undefined) {
      if (!walk_in_name || walk_in_name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên hợp lệ (ít nhất 2 ký tự).' });
      }
      booking.walk_in_name = walk_in_name.trim();
    }
    
    if (walk_in_phone !== undefined) {
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
      if (!walk_in_phone || !phoneRegex.test(walk_in_phone)) {
        return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam.' });
      }
      booking.walk_in_phone = walk_in_phone.trim();
    }

    if (order_items) booking.order_items = order_items;
    if (notes !== undefined) booking.notes = notes;
    if (note !== undefined) booking.notes = note; // frontend sends 'note'
    if (meal_type) booking.meal_type = meal_type;

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin đơn hàng thành công.',
      data: booking
    });
  } catch (error) {
    console.error('Lỗi updateBookingInfo:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Thêm/Thay đổi voucher vào booking (Waiter thao tác tại quán)
// @route  POST /api/v1/bookings/:id/apply-voucher
// @access Private (WAITER, MANAGER)
const applyVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt bàn.' });
    }

    // BẢO MẬT: Waiter/Manager chỉ được thao tác trên đơn của chi nhánh mình
    if (['MANAGER', 'WAITER'].includes(req.user.role) && String(booking.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên đơn của chi nhánh khác.' });
    }

    if (!code) {
      // Gỡ voucher (nếu code null hoặc rỗng)
      booking.applied_voucher_code = null;
      booking.voucher_discount_amount = 0;
      if (booking.payment_info && booking.payment_info.voucher_code) {
        booking.payment_info.voucher_code = undefined;
      }
      await booking.save();
      return res.status(200).json({ success: true, message: 'Đã gỡ voucher.', data: booking });
    }

    const Voucher = require('../models/Voucher');
    const voucher = await Voucher.findOne({ code: code.toUpperCase() });
    
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Mã voucher không hợp lệ.' });
    }

    if (!voucher.is_active) {
      return res.status(400).json({ success: false, message: 'Mã voucher đã bị khóa.' });
    }

    const now = new Date();
    if (new Date(voucher.valid_until) < now) {
      return res.status(400).json({ success: false, message: 'Voucher đã hết hạn.' });
    }

    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ success: false, message: 'Voucher đã hết số lượt sử dụng.' });
    }

    // Check branch
    if (voucher.branch_id && voucher.branch_id.toString() !== booking.branch_id.toString()) {
      return res.status(400).json({ success: false, message: 'Voucher không áp dụng cho chi nhánh này.' });
    }

    // Check guest count
    if (voucher.min_guest_count && booking.guest_count < voucher.min_guest_count) {
      return res.status(400).json({ 
        success: false, 
        message: `Voucher yêu cầu bàn từ ${voucher.min_guest_count} người.`
      });
    }

    // Calculate total bill for discount
    const items = booking.order_items || [];
    const calculatedTotal = items.reduce((acc, item) => acc + (item.price_at_time * item.quantity), 0);
    const totalBill = calculatedTotal > 0 ? calculatedTotal : (booking.pre_order_total_amount || 0);

    // Check min order value
    if (voucher.min_order_value && totalBill < voucher.min_order_value) {
      return res.status(400).json({
        success: false,
        message: `Voucher yêu cầu hóa đơn tối thiểu ${voucher.min_order_value.toLocaleString()}đ. Hiện tại hóa đơn là ${totalBill.toLocaleString()}đ.`
      });
    }

    let discount = 0;
    if (voucher.discount_percentage) {
      discount = (totalBill * voucher.discount_percentage) / 100;
    }
    if (voucher.max_discount_amount && discount > voucher.max_discount_amount) {
      discount = voucher.max_discount_amount;
    }

    // Lưu voucher_code và số tiền giảm vào booking
    booking.applied_voucher_code = voucher.code;
    booking.voucher_discount_amount = discount;
    if (booking.payment_info && booking.payment_info.voucher_code) {
      booking.payment_info.voucher_code = undefined;
    }
    await booking.save();

    res.status(200).json({ 
      success: true, 
      message: 'Đã cập nhật mã voucher cho đơn đặt bàn.',
      data: booking 
    });

  } catch (error) {
    console.error('Lỗi applyVoucher:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Khách hàng tự hủy bàn và yêu cầu hoàn cọc
// @route  POST /api/v1/bookings/:id/cancel-refund
// @access Private (CUSTOMER)
const cancelAndRequestRefund = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt bàn.' });
    }

    // Kiểm tra quyền sở hữu
    if (String(booking.customer_id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn này.' });
    }

    // Kiểm tra trạng thái cho phép hủy
    if (!['PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Đơn đặt bàn này không thể hủy được nữa.' });
    }

    // Nếu chưa thanh toán, chỉ cần hủy
    if (booking.status === 'PENDING_PAYMENT' || booking.total_deposit_paid === 0) {
      booking.status = 'CANCELLED';
      booking.cancellation_reason = 'Khách hàng tự hủy (Chưa thanh toán)';
      await booking.save({ session });
      
      // Nhả bàn
      if (booking.table_ids && booking.table_ids.length > 0) {
        const TableLockService = require('../services/tableLockService');
        await TableLockService.unlockTables(booking.branch_id.toString(), booking.table_ids.map(id => id.toString()));
      }

      // === XỬ LÝ HOÀN KHO (INVENTORY ROLLBACK) ===
      if (booking.order_items && booking.order_items.length > 0) {
        const BookingService = require('../services/bookingService');
        const pendingItems = booking.order_items.filter(item => item.prep_status === 'PENDING');
        if (pendingItems.length > 0) {
          await BookingService.syncInventory(pendingItems, booking.branch_id, false, session);
        }
      }

      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ success: true, message: 'Hủy đơn thành công.', data: booking });
    }

    // Đã thanh toán -> Tính toán hoàn cọc dựa trên thời gian
    const now = new Date();
    const reservationDate = new Date(booking.reservation_date);
    const [hours, minutes] = (booking.arrival_time || '00:00').split(':').map(Number);
    reservationDate.setHours(hours, minutes, 0, 0);

    const timeDiffHours = (reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (timeDiffHours >= 12) {
      refundPercentage = 100;
    } else if (timeDiffHours >= 6) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = (booking.total_deposit_paid || 0) * (refundPercentage / 100);

    const { bank_account_number, bank_name, account_holder_name, reason } = req.body;

    // Cập nhật thông tin hoàn tiền
    booking.refund_info = {
      refund_amount: refundAmount,
      refund_percentage: refundPercentage,
      bank_account_number: bank_account_number || '',
      bank_name: bank_name || '',
      account_holder_name: account_holder_name || '',
    };

    booking.cancellation_reason = reason ? `[Khách tự hủy] ${reason}` : `Khách tự hủy trước ${timeDiffHours.toFixed(1)} tiếng. Hoàn ${refundPercentage}%.`;


    if (refundAmount > 0) {
      booking.status = 'CANCELLED_REFUND_PENDING';
    } else {
      booking.status = 'CANCELLED'; // Không hoàn tiền, hủy luôn
    }

    await booking.save({ session });

    // Nhả bàn cho Booking
    if (booking.table_ids && booking.table_ids.length > 0) {
      const TableLockService = require('../services/tableLockService');
      await TableLockService.unlockTables(booking.branch_id.toString(), booking.table_ids.map(id => id.toString()));
      
      const Branch = require('../models/Branch');
      await Branch.updateOne(
        { _id: booking.branch_id },
        { $set: { 'zones.$[].tables.$[tbl].status': 'EMPTY' } },
        { arrayFilters: [{ 'tbl._id': { $in: booking.table_ids } }], session }
      );
    }

    // === XỬ LÝ HOÀN KHO (INVENTORY ROLLBACK) ===
    if (booking.order_items && booking.order_items.length > 0) {
      const BookingService = require('../services/bookingService');
      const pendingItems = booking.order_items.filter(item => item.prep_status === 'PENDING');
      if (pendingItems.length > 0) {
        await BookingService.syncInventory(pendingItems, booking.branch_id, false, session);
      }
    }

    // Socket io emit cho Manager
    const io = require('../socket').getIO();
    io.to(`branch_${booking.branch_id}`).emit('BOOKING_STATUS_CHANGED', {
      bookingId: booking._id,
      status: booking.status
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ 
      success: true, 
      message: refundAmount > 0 
        ? `Hủy đơn thành công. Bạn được hoàn ${refundPercentage}% (${refundAmount.toLocaleString()}đ) cọc. Vui lòng chờ nhà hàng xử lý.` 
        : `Hủy đơn thành công. Bạn không được hoàn cọc do hủy dưới 6 tiếng.`,
      data: booking 
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Lỗi cancelAndRequestRefund:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = { 
  createBooking, 
  getAllBookings, 
  getBookingById, 
  updateBookingStatus, 
  getMyBookings, 
  updateBookingInfo,
  applyVoucher,
  cancelAndRequestRefund
};