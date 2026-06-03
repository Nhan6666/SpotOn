const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getMyBookings,
} = require('../controllers/bookingController');
// const { protect, authorize } = require('../middlewares/authMiddleware');

// GET    /api/v1/bookings              -> Tất cả bookings (Admin/Manager)
// POST   /api/v1/bookings              -> Tạo booking mới
router.route('/')
  .get(getAllBookings)
  .post(createBooking);

// GET /api/v1/bookings/my-bookings     -> Booking của tôi (Customer)
router.get('/my-bookings', getMyBookings);

// GET   /api/v1/bookings/:id           -> Chi tiết booking
// PATCH /api/v1/bookings/:id/status    -> Cập nhật trạng thái
router.get('/:id', getBookingById);
router.patch('/:id/status', updateBookingStatus);

module.exports = router;
