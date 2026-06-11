const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getMyBookings,
} = require('../controllers/bookingController');

// MỞ KHÓA MIDDLEWARE
const { protect, authorize } = require('../middlewares/authMiddleware');

// GET /api/v1/bookings/my-bookings     -> Booking của chính khách hàng đang login (Customer)
router.get('/my-bookings', protect, authorize('CUSTOMER'), getMyBookings);

// GET    /api/v1/bookings              -> Tất cả bookings (Admin/Manager/Waiter)
// POST   /api/v1/bookings              -> Tạo booking mới (Đăng nhập là tạo được)
router.route('/')
  .get(protect, authorize('ADMIN', 'MANAGER', 'WAITER'), getAllBookings)
  .post(protect, createBooking);

// GET   /api/v1/bookings/:id           -> Chi tiết 1 booking (Bảo vệ vòng ngoài, vòng trong check đúng chủ đơn)
// PATCH /api/v1/bookings/:id/status    -> Cập nhật trạng thái đơn đặt (Admin/Manager)
router.get('/:id', protect, getBookingById);
router.patch('/:id/status', protect, authorize('ADMIN', 'MANAGER'), updateBookingStatus);

module.exports = router;