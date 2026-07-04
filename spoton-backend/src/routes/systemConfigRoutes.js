const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getBookingRules, updateBookingRules } = require('../controllers/systemConfigController');

// Quản lý chính sách đặt bàn toàn hệ thống
router.get('/booking-rules', protect, authorize('ADMIN', 'MANAGER'), getBookingRules);
router.put('/booking-rules', protect, authorize('ADMIN'), updateBookingRules);

module.exports = router;
