// ============================================================
// BOOKING CONTROLLER
// Xử lý: Tạo booking, xem danh sách, cập nhật trạng thái
// ============================================================
const Booking = require('../models/Booking');

// @desc   Tạo booking mới (có tài khoản hoặc walk-in)
// @route  POST /api/v1/bookings
// @access Private
const createBooking = async (req, res) => {
  try {
    const bookingData = { ...req.body };

    // TÍNH NĂNG BẢO MẬT: Nếu là Customer tự đặt, ép cứng user_id là ID của họ (tránh giả mạo truyền ID người khác lên)
    if (req.user.role === 'CUSTOMER') {
      bookingData.user_id = req.user._id;
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

    const bookings = await Booking.find(filter)
      .populate('user_id', 'full_name email phone')
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
      .populate('user_id', 'full_name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt bàn.' });
    }

    // TÍNH NĂNG BẢO MẬT VÒNG TRONG:
    // 1. Nếu là Khách, phải là người tạo đơn mới được xem
    if (req.user.role === 'CUSTOMER') {
      if (String(booking.user_id._id || booking.user_id) !== String(req.user._id)) {
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

    booking.status = status;
    await booking.save();

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
    const bookings = await Booking.find({ user_id: req.user._id })
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

module.exports = { createBooking, getAllBookings, getBookingById, updateBookingStatus, getMyBookings };