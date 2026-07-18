const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getMyBookings,
  updateBookingInfo,
  applyVoucher,
  cancelAndRequestRefund
} = require('../controllers/bookingController');

// MỞ KHÓA MIDDLEWARE
const { protect, authorize, optionalAuth } = require('../middlewares/authMiddleware');

// GET /api/v1/bookings/my-bookings     -> Booking của chính khách hàng đang login (Customer)
router.get('/my-bookings', protect, authorize('CUSTOMER'), getMyBookings);

// GET    /api/v1/bookings              -> Tất cả bookings (Admin/Manager/Waiter/Kitchen)
// POST   /api/v1/bookings              -> Tạo booking mới (Đăng nhập là tạo được)
router.route('/')
  .get(protect, authorize('ADMIN', 'MANAGER', 'WAITER', 'KITCHEN'), getAllBookings)
  .post(protect, createBooking);

// GET   /api/v1/bookings/:id           -> Chi tiết 1 booking (Bảo vệ vòng ngoài bằng optionalAuth, vòng trong check đúng chủ đơn)
// PUT   /api/v1/bookings/:id/update-info -> Cập nhật thông tin & chốt món
// PATCH /api/v1/bookings/:id/status    -> Cập nhật trạng thái đơn đặt (Admin/Manager)
router.get('/:id', optionalAuth, getBookingById);
router.put('/:id/update-info', protect, updateBookingInfo);
router.patch('/:id/status', protect, authorize('ADMIN', 'MANAGER'), updateBookingStatus);
router.post('/:id/apply-voucher', protect, authorize('MANAGER', 'WAITER'), applyVoucher);
router.post('/:id/cancel-refund', protect, authorize('CUSTOMER'), cancelAndRequestRefund);

module.exports = router;