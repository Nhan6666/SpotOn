const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/receptionController');

const { protect, authorize, optionalAuth } = require('../middlewares/authMiddleware');

// Public API cho Đặt Bàn (Lễ tân/Khách)
router.get('/availability', checkAvailability);
router.post('/hold', protect, holdBooking);
router.delete('/hold/:id', protect, releaseHoldingBooking);

// Waiter/Manager thao tác trực tiếp tại nhà hàng
router.post('/walk-in', protect, authorize('MANAGER', 'WAITER'), createWalkInBooking);
router.patch('/bookings/:id/check-in', protect, authorize('ADMIN', 'MANAGER', 'WAITER'), checkInBooking);
router.patch('/bookings/:id/checkout', protect, authorize('ADMIN', 'MANAGER', 'WAITER'), checkoutBooking);
router.patch('/bookings/:id/force-release', protect, authorize('ADMIN', 'MANAGER'), forceReleaseBooking);

router.post('/bookings/:id/adjustments', protect, authorize('ADMIN', 'MANAGER'), addBillAdjustment);
router.delete('/bookings/:id/adjustments/:adjId', protect, authorize('ADMIN', 'MANAGER'), removeBillAdjustment);

// Hoàn tiền — CHỈ Manager/Admin (Waiter KHÔNG được phép)
router.post('/bookings/:id/refund', protect, authorize('ADMIN', 'MANAGER'), processRefund);

module.exports = router;
