const express = require('express');
const router = express.Router();
const { getBranchDashboardStats, getChainDashboardStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// @route  GET /api/v1/stats/branch/:id/dashboard
router.get('/branch/:id/dashboard', protect, authorize('ADMIN', 'MANAGER'), getBranchDashboardStats);

// @route  GET /api/v1/stats/chain/dashboard
router.get('/chain/dashboard', protect, authorize('ADMIN'), getChainDashboardStats);

module.exports = router;
