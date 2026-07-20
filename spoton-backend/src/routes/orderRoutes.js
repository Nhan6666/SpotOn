const express = require('express');
const router = express.Router();
const {
  addAdditionalOrder,
  updateOrderItemStatus,
  unlockIpad
} = require('../controllers/orderController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Public/iPad Auth API
router.post('/ipad/unlock-by-table', unlockIpad);

// Waiter/Manager/IPAD gọi món bổ sung
router.post('/:id/items', protect, authorize('MANAGER', 'WAITER', 'IPAD'), addAdditionalOrder);

// KDS Bếp/Waiter cập nhật trạng thái món ăn
router.patch('/:id/items/:itemId/status', protect, authorize('KITCHEN', 'MANAGER', 'WAITER'), updateOrderItemStatus);

module.exports = router;
