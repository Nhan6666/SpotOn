// ============================================================
// BOOKING CONTROLLER
// Xử lý: Tạo booking, xem danh sách, cập nhật trạng thái
// ============================================================
const Booking = require('../models/Booking');
const Branch = require('../models/Branch');

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

    booking.status = status;
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

// @desc   Kiểm tra bàn trống
// @route  GET /api/v1/bookings/availability
// @access Public
const checkAvailability = async (req, res) => {
  try {
    const { branch_id, date, time } = req.query; // date: YYYY-MM-DD, time: "HH:MM"

    if (!branch_id || !date || !time) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số bắt buộc (branch_id, date, time).' });
    }

    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Chi nhánh không tồn tại.' });
    }

    const targetMinutes = timeToMinutes(time);
    const { lunch, dinner } = branch.service_periods || {};

    let shift = null;
    let shiftEnd = null;

    // Check if time is in Lunch shift
    if (lunch && lunch.start && lunch.end) {
      const startMins = timeToMinutes(lunch.start);
      const endMins = timeToMinutes(lunch.end);
      if (targetMinutes >= startMins && targetMinutes <= endMins) {
        shift = 'LUNCH';
        shiftEnd = endMins;
      }
    }

    // Check if time is in Dinner shift
    if (!shift && dinner && dinner.start && dinner.end) {
      const startMins = timeToMinutes(dinner.start);
      const endMins = timeToMinutes(dinner.end);
      if (targetMinutes >= startMins && targetMinutes <= endMins) {
        shift = 'DINNER';
        shiftEnd = endMins;
      }
    }

    if (!shift) {
      return res.status(400).json({ success: false, message: 'Thời gian chọn không nằm trong ca hoạt động của nhà hàng.' });
    }

    // Rule: Cannot book if within 2 hours of closing time (120 minutes)
    if (shiftEnd - targetMinutes < 120) {
      return res.status(400).json({ success: false, message: 'Giờ đến phải cách giờ đóng cửa ca ít nhất 2 tiếng.' });
    }

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
        { status: { $in: ['PENDING_PAYMENT', 'PENDING_DEPOSIT', 'CONFIRMED'] } },
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

  } catch (error) {
    console.error('Lỗi checkAvailability:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Giữ bàn tạm thời (Hold)
// @route  POST /api/v1/bookings/hold
// @access Private
const holdBooking = async (req, res) => {
  try {
    const { branch_id, date, time, table_ids, guest_count } = req.body;

    if (!branch_id || !date || !time || !table_ids || table_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt bàn (branch, date, time, tables).' });
    }

    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Chi nhánh không tồn tại.' });
    }

    const targetMinutes = timeToMinutes(time);
    const { lunch, dinner } = branch.service_periods || {};

    let shift = null;
    let shiftEnd = null;

    if (lunch && lunch.start && lunch.end) {
      const startMins = timeToMinutes(lunch.start);
      const endMins = timeToMinutes(lunch.end);
      if (targetMinutes >= startMins && targetMinutes <= endMins) {
        shift = 'LUNCH';
        shiftEnd = endMins;
      }
    }
    if (!shift && dinner && dinner.start && dinner.end) {
      const startMins = timeToMinutes(dinner.start);
      const endMins = timeToMinutes(dinner.end);
      if (targetMinutes >= startMins && targetMinutes <= endMins) {
        shift = 'DINNER';
        shiftEnd = endMins;
      }
    }

    if (!shift) {
      return res.status(400).json({ success: false, message: 'Thời gian chọn không nằm trong ca hoạt động.' });
    }
    if (shiftEnd - targetMinutes < 120) {
      return res.status(400).json({ success: false, message: 'Giờ đến phải cách giờ đóng cửa ca ít nhất 2 tiếng.' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Khóa bi quan (Optimistic check): Tìm xem có booking nào chùng bàn vừa được hold không
    const conflictingBookings = await Booking.find({
      branch_id,
      shift,
      reservation_date: { $gte: targetDate, $lt: nextDate },
      table_ids: { $in: table_ids },
      $or: [
        { status: { $in: ['PENDING_PAYMENT', 'PENDING_DEPOSIT', 'CONFIRMED'] } },
        { status: 'HOLDING', expires_at: { $gt: new Date() } }
      ]
    });

    if (conflictingBookings.length > 0) {
      console.log('Conflicting bookings found:', conflictingBookings);
      return res.status(409).json({ success: false, message: 'Có bàn đã được khách khác chọn. Vui lòng chọn bàn khác.' });
    }

    // Tạo booking nháp
    const newBooking = await Booking.create({
      branch_id,
      customer_id: req.user ? req.user._id : null, // Gán user_id nếu có
      reservation_date: date,
      arrival_time: time,
      shift,
      guest_count: guest_count || 1,
      table_ids,
      status: 'HOLDING',
      expires_at: new Date(Date.now() + 10 * 60000) // 10 phút đếm ngược
    });

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
  } catch (error) {
    console.error('Lỗi holdBooking:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật thông tin đặt bàn (Menu Cart, Thông tin KH)
// @route  PUT /api/v1/bookings/:id/update-info
// @access Public
const updateBookingInfo = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { walk_in_name, walk_in_phone, note, order_items } = req.body;

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt bàn nháp.' });
    }

    if (booking.status !== 'HOLDING') {
      return res.status(400).json({ success: false, message: 'Đơn đặt bàn này đã quá hạn hoặc đã được xác nhận.' });
    }

    // Update customer info
    if (walk_in_name) booking.walk_in_name = walk_in_name;
    if (walk_in_phone) booking.walk_in_phone = walk_in_phone;
    if (note !== undefined) booking.note = note;

    // Update cart
    if (order_items && Array.isArray(order_items)) {
      booking.order_items = order_items.map(item => ({
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        price_at_time: item.price_at_time,
        type: 'PRE_ORDER',
        prep_status: 'PENDING'
      }));
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin đơn đặt bàn thành công.',
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
  checkAvailability, 
  holdBooking, 
  updateBookingInfo 
};