// ============================================================
// BOOKING CONTROLLER
// Xử lý: Tạo booking, xem danh sách, cập nhật trạng thái
// ============================================================
const Booking = require('../models/Booking');

// @desc   Tạo booking mới (có tài khoản hoặc walk-in)
// @route  POST /api/v1/bookings
// @access Public / Private
const createBooking = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Lấy tất cả bookings (Admin/Manager)
// @route  GET /api/v1/bookings
// @access Private (ADMIN, MANAGER)
const getAllBookings = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Lấy booking theo ID
// @route  GET /api/v1/bookings/:id
// @access Private
const getBookingById = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Cập nhật trạng thái booking (CONFIRMED, CANCELLED, COMPLETED...)
// @route  PATCH /api/v1/bookings/:id/status
// @access Private (ADMIN, MANAGER)
const updateBookingStatus = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Lấy danh sách booking của khách hàng đang đăng nhập
// @route  GET /api/v1/bookings/my-bookings
// @access Private (CUSTOMER)
const getMyBookings = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports = { createBooking, getAllBookings, getBookingById, updateBookingStatus, getMyBookings };
