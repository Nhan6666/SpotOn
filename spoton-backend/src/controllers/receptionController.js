const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');

// @desc   Kiểm tra bàn trống
// @route  GET /api/v1/reception/availability
// @access Public
const checkAvailability = asyncHandler(async (req, res) => {
  const { branch_id, date, time } = req.query; // date: YYYY-MM-DD, time: "HH:MM"

  if (!branch_id || !date || !time) {
    const err = new Error('Thiếu tham số bắt buộc (branch_id, date, time).');
    err.statusCode = 400;
    throw err;
  }

  const shift = await require('../services/bookingService').validateAndGetShift(branch_id, time);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  // Tìm các bàn đang được giữ hoặc đã xác nhận trong cùng ca + ngày
  const existingBookings = await Booking.find({
    branch_id,
    shift,
    reservation_date: { $gte: targetDate, $lt: nextDate },
    $or: [
      { status: { $in: ['PENDING_PAYMENT', 'PENDING_DEPOSIT', 'CONFIRMED', 'IN_USE', 'OCCUPIED', 'RESERVED'] } },
      { status: 'HOLDING', expires_at: { $gt: new Date() } }
    ]
  });

  const bookedTableIds = [];
  existingBookings.forEach(b => {
    if (b.table_ids && b.table_ids.length > 0) {
      bookedTableIds.push(...b.table_ids.map(id => id.toString()));
    }
  });

  res.status(200).json({
    success: true,
    message: 'Lấy trạng thái bàn thành công.',
    data: {
      shift,
      booked_table_ids: [...new Set(bookedTableIds)]
    }
  });
});

// @desc   Giữ bàn tạm thời (Hold)
// @route  POST /api/v1/reception/hold
// @access Private
const holdBooking = asyncHandler(async (req, res) => {
  const { branch_id, date, time, table_ids } = req.body;

  if (!branch_id || !date || !time || !table_ids || table_ids.length === 0) {
    const err = new Error('Thiếu thông tin đặt bàn (branch, date, time, tables).');
    err.statusCode = 400;
    throw err;
  }

  // Gọi Service xử lý nghiệp vụ phức tạp + Transaction
  const newBooking = await require('../services/bookingService').holdBookingSafe(req.body, req.user ? req.user._id : null);

  // Phát event qua WebSocket để cập nhật Real-time (User & Manager & Waiter)
  const io = require('../socket').getIO();
  io.to(`branch_${branch_id}`).emit('table_status_changed', {
    action: 'HOLDING',
    branch_id: branch_id,
    booking_id: newBooking._id,
    table_ids: table_ids
  });

  res.status(201).json({
    success: true,
    message: 'Giữ bàn thành công. Bạn có 10 phút để hoàn tất.',
    data: newBooking
  });
});

// @desc   Hủy bàn đang giữ (Release Hold)
// @route  DELETE /api/v1/reception/hold/:id
// @access Public
const releaseHoldingBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin giữ bàn.' });
    }

    if (booking.status === 'HOLDING') {
      booking.status = 'CANCELLED';
      await booking.save();

      // Release Redis lock
      if (booking.table_ids && booking.table_ids.length > 0) {
        const TableLockService = require('../services/tableLockService');
        await TableLockService.unlockTables(
          booking.branch_id.toString(),
          booking.table_ids.map(id => id.toString())
        );
      }

      // Phát event qua WebSocket để cập nhật Real-time (User & Manager & Waiter)
      try {
        const io = require('../socket').getIO();
        io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
          action: 'EMPTY',
          branch_id: booking.branch_id,
          booking_id: booking._id,
          table_ids: booking.table_ids
        });
      } catch (e) {}
    }

    res.status(200).json({ success: true, message: 'Đã nhả bàn thành công.' });
  } catch (error) {
    console.error('Lỗi releaseHoldingBooking:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi nhả bàn.' });
  }
};

// @desc   Check-in booking (chuyển sang IN_USE và đổi trạng thái bàn)
// @route  PATCH /api/v1/reception/bookings/:id/check-in
// @access Private (Manager/Admin)
const checkInBooking = async (req, res) => {
  try {
    const BookingService = require('../services/bookingService');
    const booking = await BookingService.checkInBooking(req.params.id);

    // 3. Hiệu ứng phụ: Emit WebSocket
    const io = require('../socket').getIO();
    
    // Nếu có món ăn đặt trước, bắn xuống bếp
    if (booking.order_items && booking.order_items.length > 0) {
      io.to(`branch_${booking.branch_id}_kitchen`).emit('NEW_KITCHEN_ORDER', {
        bookingId: booking._id,
        tableNames: booking.assigned_tables?.map(t => t.table_number).join(', '),
        items: booking.order_items
      });
    }

    // Bật iPad tại từng bàn
    if (booking.table_ids) {
      booking.table_ids.forEach(tableId => {
        io.to(`table_${tableId}`).emit('ACTIVATE_IPAD', {
          bookingId: booking._id,
          customerName: booking.customer_id?.full_name || booking.walk_in_name || 'Khách hàng',
          tableId: tableId
        });
      });
    }

    // Báo cho các Manager khác biết để update Kanban
    io.to(`branch_${booking.branch_id}`).emit('BOOKING_STATUS_CHANGED', {
      bookingId: booking._id,
      status: 'IN_USE'
    });
    
    // Cập nhật lại UI bản đồ ngay lập tức
    io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
      action: 'OCCUPIED',
      branch_id: booking.branch_id,
      booking_id: booking._id,
      table_ids: booking.table_ids,
    });

    res.status(200).json({ 
      success: true, 
      message: 'Check-in thành công. Đã chuyển trạng thái bàn sang Đang dùng.',
      data: booking 
    });

  } catch (error) {
    console.error('Lỗi checkInBooking:', error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Lỗi server nội bộ trong quá trình check-in.' 
    });
  }
};

// @desc   Checkout booking (Thanh toán chốt bill, giải phóng bàn)
// @route  PATCH /api/v1/reception/bookings/:id/checkout
// @access Private (Manager/Admin)
const checkoutBooking = async (req, res) => {
  try {
    const BookingService = require('../services/bookingService');
    const booking = await BookingService.checkoutBooking(req.params.id);

    // 3. Hiệu ứng phụ: Emit WebSocket
    const io = require('../socket').getIO();
    
    // Tắt iPad tại từng bàn (Reset)
    if (booking.table_ids) {
      booking.table_ids.forEach(tableId => {
        io.to(`table_${tableId}`).emit('RESET_IPAD', {
          tableId: tableId
        });
      });
    }

    // Báo cho các Manager khác biết
    io.to(`branch_${booking.branch_id}`).emit('BOOKING_STATUS_CHANGED', {
      bookingId: booking._id,
      status: 'COMPLETED'
    });
    
    // Cập nhật lại UI bản đồ ngay lập tức
    io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
      action: 'EMPTY',
      branch_id: booking.branch_id,
      table_ids: booking.table_ids,
    });

    res.status(200).json({ 
      success: true, 
      message: 'Thanh toán thành công. Đã in hóa đơn và giải phóng bàn.',
      data: booking 
    });

  } catch (error) {
    console.error('Lỗi checkoutBooking:', error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Lỗi server nội bộ trong quá trình thanh toán.' 
    });
  }
};

// @desc   Nhả bàn (Force Release) khi chưa thanh toán (chuyển sang PENDING_SETTLEMENT)
// @route  PATCH /api/v1/reception/bookings/:id/force-release
// @access Private (Manager/Admin)
const forceReleaseBooking = async (req, res) => {
  try {
    const BookingService = require('../services/bookingService');
    const booking = await BookingService.forceReleaseBooking(req.params.id);

    const io = require('../socket').getIO();
    
    // Tắt iPad tại từng bàn (Reset)
    if (booking.table_ids) {
      booking.table_ids.forEach(tableId => {
        io.to(`table_${tableId}`).emit('RESET_IPAD', {
          tableId: tableId
        });
      });
    }

    // Báo cho các Manager khác biết
    io.to(`branch_${booking.branch_id}`).emit('BOOKING_STATUS_CHANGED', {
      bookingId: booking._id,
      status: 'PENDING_SETTLEMENT'
    });
    
    // Cập nhật lại UI bản đồ ngay lập tức
    io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
      action: 'EMPTY',
      branch_id: booking.branch_id,
      table_ids: booking.table_ids,
    });

    res.status(200).json({ 
      success: true, 
      message: 'Nhả bàn thành công. Đơn hàng được chuyển sang danh sách chờ đối soát.',
      data: booking 
    });

  } catch (error) {
    console.error('Lỗi forceReleaseBooking:', error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Lỗi server nội bộ trong quá trình nhả bàn.' 
    });
  }
};

// @desc   Mở bàn cho khách vãng lai (Tạo đơn + Check-in ngay lập tức)
// @route  POST /api/v1/reception/walk-in
// @access Private (Waiter/Manager)
const createWalkInBooking = async (req, res) => {
  try {
    const BookingService = require('../services/bookingService');
    const branch_id = req.user.branch_id;
    const { table_ids } = req.body;
    
    const booking = await BookingService.createWalkInBooking(req.body, branch_id);

    // 3. Side-effects (Sockets)
    const io = require('../socket').getIO();
    
    // Mở khóa iPad tại bàn
    if (table_ids) {
      table_ids.forEach(tableId => {
        io.to(`table_${tableId}`).emit('ACTIVATE_IPAD', {
          bookingId: booking._id,
          customerName: 'Khách vãng lai',
          tableId: tableId
        });
      });
    }

    // Cập nhật Sơ đồ bàn cho toàn chi nhánh
    io.to(`branch_${branch_id}`).emit('table_status_changed', {
      action: 'OCCUPIED',
      branch_id,
      booking_id: booking._id,
      table_ids
    });

    // Báo cho Manager Kanban
    io.to(`branch_${branch_id}`).emit('BOOKING_STATUS_CHANGED', {
      bookingId: booking._id,
      status: 'IN_USE'
    });

    res.status(201).json({
      success: true,
      message: 'Mở bàn thành công! iPad tại bàn đã được kích hoạt.',
      data: booking
    });

  } catch (error) {
    console.error('Lỗi createWalkInBooking:', error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Lỗi server khi mở bàn vãng lai.' 
    });
  }
};

// @desc   Thêm điều chỉnh hóa đơn (Giảm giá phát sinh, thiếu món...)
// @route  POST /api/v1/reception/bookings/:id/adjustments
// @access Private (Manager/Admin)
const addBillAdjustment = async (req, res) => {
  try {
    const BookingService = require('../services/bookingService');
    const booking = await BookingService.addBillAdjustment(req.params.id, req.body, req.user._id);

    const io = require('../socket').getIO();
    io.to(`branch_${booking.branch_id}`).emit('BOOKING_UPDATED', { bookingId: booking._id });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc   Xóa điều chỉnh hóa đơn
// @route  DELETE /api/v1/reception/bookings/:id/adjustments/:adjId
// @access Private (Manager/Admin)
const removeBillAdjustment = async (req, res) => {
  try {
    const BookingService = require('../services/bookingService');
    const booking = await BookingService.removeBillAdjustment(req.params.id, req.params.adjId);

    const io = require('../socket').getIO();
    io.to(`branch_${booking.branch_id}`).emit('BOOKING_UPDATED', { bookingId: booking._id });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc   Hoàn tiền cho khách (Refund)
// @route  POST /api/v1/reception/bookings/:id/refund
// @access Private (Manager/Admin ONLY — Waiter KHÔNG được phép)
const processRefund = async (req, res) => {
  try {
    const BookingService = require('../services/bookingService');
    
    // refund_proof_url đã được upload trước qua /api/v1/uploads/refund
    const { refund_amount, reason, refund_proof_url } = req.body;
    
    const booking = await BookingService.processRefund(
      req.params.id, 
      { refund_amount: Number(refund_amount), reason, refund_proof_url },
      req.user._id
    );

    const io = require('../socket').getIO();
    io.to(`branch_${booking.branch_id}`).emit('BOOKING_STATUS_CHANGED', {
      bookingId: booking._id,
      status: booking.status
    });

    res.status(200).json({ 
      success: true, 
      message: `Hoàn tiền ${Number(refund_amount).toLocaleString()}đ thành công.`,
      data: booking 
    });

  } catch (error) {
    console.error('Lỗi processRefund:', error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Lỗi server khi xử lý hoàn tiền.' 
    });
  }
};

module.exports = {
  checkAvailability,
  holdBooking,
  releaseHoldingBooking,
  checkInBooking,
  checkoutBooking,
  forceReleaseBooking,
  createWalkInBooking,
  addBillAdjustment,
  removeBillAdjustment,
  processRefund
};
