const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getMyBookings,
  updateBookingInfo,
  cancelBookingByCustomer
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
// PUT   /api/v1/bookings/:id/update-info -> Cập nhật thông tin & chốt món
// PATCH /api/v1/bookings/:id/status    -> Cập nhật trạng thái đơn đặt (Admin/Manager)
// POST  /api/v1/bookings/:id/cancel    -> Khách hàng hủy bàn
router.get('/:id', protect, getBookingById);
router.put('/:id/update-info', updateBookingInfo);
router.patch('/:id/status', protect, authorize('ADMIN', 'MANAGER'), updateBookingStatus);
router.post('/:id/cancel', protect, authorize('CUSTOMER'), cancelBookingByCustomer);

module.exports = router;