// ============================================================
// BOOKING CONTROLLER
// Xử lý: Tạo booking, xem danh sách, cập nhật trạng thái
// ============================================================
const Booking = require('../models/Booking');
const Branch = require('../models/Branch');
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
    if (req.user.role === 'CUSTOMER') {
      bookingData.customer_id = req.user._id;
    }

    // Tự động gán branch_id hiện tại nếu Manager/Waiter tạo đơn cho khách walk-in
    if (['MANAGER', 'WAITER'].includes(req.user.role)) {
      bookingData.branch_id = req.user.branch_id;
    }

    const newBooking = await Booking.create(bookingData);

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
    // Manager và Waiter chỉ được lấy danh sách đơn của chi nhánh mình làm việc
    if (['MANAGER', 'WAITER'].includes(req.user.role)) {
      filter.branch_id = req.user.branch_id;
    }

    if (req.query.branch_id && req.user.role === 'ADMIN') {
      filter.branch_id = req.query.branch_id;
    }

    if (req.query.start_date && req.query.end_date) {
      filter.reservation_date = {
        $gte: new Date(req.query.start_date),
        $lt: new Date(req.query.end_date)
      };
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
    // 1. Nếu là Khách, phải là người tạo đơn mới được xem
    if (req.user.role === 'CUSTOMER') {
      if (String(booking.customer_id?._id || booking.customer_id) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn đặt bàn này.' });
      }
    } 
    // 2. Nếu là Nhân sự chi nhánh, chỉ xem được đơn của chi nhánh mình
    else if (['MANAGER', 'WAITER'].includes(req.user.role)) {
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
      IN_USE: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
      CANCELLED_TIMEOUT: [],
      CANCELLED_REFUND_PENDING: ['REFUND_COMPLETED'],
      REFUND_COMPLETED: [],
      NO_SHOW: []
    };

    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ ${booking.status} sang ${status}.`
      });
    }

    booking.status = status;
    
    // Nếu là hủy thì nhả bàn
    if (['CANCELLED', 'CANCELLED_TIMEOUT', 'NO_SHOW', 'COMPLETED'].includes(status)) {
      if (booking.table_ids && booking.table_ids.length > 0) {
        const TableLockService = require('../services/tableLockService');
        await TableLockService.unlockTables(
          booking.branch_id.toString(),
          booking.table_ids.map(id => id.toString())
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

// @desc   Lấy danh sách booking của khách hàng đang đăng nhập
// @route  GET /api/v1/bookings/my-bookings
// @access Private (CUSTOMER)
const getMyBookings = async (req, res) => {
  try {
    // Chỉ lấy đơn mà thuộc về ID của chính khách hàng này (req.user._id)
    const bookings = await Booking.find({ customer_id: req.user._id })
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

    if (order_items) booking.order_items = order_items;
    if (notes !== undefined) booking.notes = notes;
    if (note !== undefined) booking.notes = note; // frontend sends 'note'
    if (meal_type) booking.meal_type = meal_type;
    if (walk_in_name) booking.walk_in_name = walk_in_name;
    if (walk_in_phone) booking.walk_in_phone = walk_in_phone;

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

module.exports = { 
  createBooking, 
  getAllBookings, 
  getBookingById, 
  updateBookingStatus, 
  getMyBookings, 
  updateBookingInfo
};