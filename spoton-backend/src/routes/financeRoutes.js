const express = require('express');
const router = express.Router();
const {
  getRevenueStats,
  getTransactions,
  getRefundAudits
} = require('../controllers/financeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Dashboard doanh thu (Admin có thể xem all, Manager xem nhánh của mình)
router.get('/revenue', protect, authorize('ADMIN', 'MANAGER'), getRevenueStats);

// Sổ cái giao dịch
router.get('/transactions', protect, authorize('ADMIN', 'MANAGER'), getTransactions);

// Kiểm toán hoàn tiền (có kèm ảnh UNC)
router.get('/refunds', protect, authorize('ADMIN', 'MANAGER'), getRefundAudits);

module.exports = router;
