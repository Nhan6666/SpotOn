const express = require('express');
const router = express.Router();
const {
  getAllBranches,
  getBranchById,
  getMyBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  getTableCapacities,
} = require('../controllers/branchController');

// Import controllers cho các route ở mức Branch nhưng thuộc về Table/Template
const { updateTableStatus, updateTableTemplate } = require('../controllers/tableController');

// Import bảo mật vào route
const { protect, authorize } = require('../middlewares/authMiddleware');

// =============================================
// BRANCH CRUD
// =============================================

// GET  /api/v1/branches/table-capacities
router.get('/table-capacities', getTableCapacities);

// GET  /api/v1/branches    -> Danh sách chi nhánh (Public)
// POST /api/v1/branches    -> Tạo chi nhánh (Chỉ ADMIN)
router.route('/')
  .get(getAllBranches)
  .post(protect, authorize('ADMIN'), createBranch);

// GET    /api/v1/branches/my/branch -> Chi nhánh của tôi (Private)
router.get('/my/branch', protect, authorize('ADMIN', 'MANAGER', 'WAITER', 'KITCHEN'), getMyBranch);

// GET    /api/v1/branches/:id -> Chi tiết chi nhánh (Public)
// PUT    /api/v1/branches/:id -> Cập nhật chi nhánh (ADMIN hoặc MANAGER)
// DELETE /api/v1/branches/:id -> Xóa chi nhánh (Chỉ ADMIN)
router.route('/:id')
  .get(getBranchById)
  .put(protect, authorize('ADMIN', 'MANAGER'), updateBranch)
  .delete(protect, authorize('ADMIN'), deleteBranch);

// PATCH /api/v1/branches/:branchId/tables/:tableId/status -> Đổi trạng thái bàn (MANAGER hoặc WAITER)
router.patch(
  '/:branchId/tables/:tableId/status', 
  protect, 
  authorize('ADMIN', 'MANAGER', 'WAITER'), 
  updateTableStatus
);

// PUT /api/v1/branches/:branchId/templates/:templateIndex
router.put(
  '/:branchId/templates/:templateIndex',
  protect,
  authorize('ADMIN', 'MANAGER'),
  updateTableTemplate
);

// =============================================
// ZONE & TABLE CRUD (Router Nesting)
// =============================================
const zoneRoutes = require('./zoneRoutes');
router.use('/:branchId/zones', zoneRoutes);

module.exports = router;