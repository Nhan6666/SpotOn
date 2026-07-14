const express = require('express');
const router = express.Router();
const {
  checkAvailability,
  holdBooking,
  releaseHoldingBooking,
  checkInBooking,
  checkoutBooking,
  forceReleaseBooking,
  createWalkInBooking
} = require('../controllers/receptionController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Public API cho Đặt Bàn (Lễ tân/Khách)
router.get('/availability', checkAvailability);
router.post('/hold', holdBooking);
router.delete('/hold/:id', releaseHoldingBooking);

// Waiter/Manager thao tác trực tiếp tại nhà hàng
router.post('/walk-in', protect, authorize('MANAGER', 'WAITER'), createWalkInBooking);
router.patch('/bookings/:id/check-in', protect, authorize('ADMIN', 'MANAGER', 'WAITER'), checkInBooking);
router.patch('/bookings/:id/checkout', protect, authorize('ADMIN', 'MANAGER', 'WAITER'), checkoutBooking);
router.patch('/bookings/:id/force-release', protect, authorize('ADMIN', 'MANAGER'), forceReleaseBooking);

module.exports = router;
