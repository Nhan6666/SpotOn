const express = require('express');
const router = express.Router();
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  updateTableStatus,
  getZonesByBranch,
  addZone,
  updateZone,
  deleteZone,
  addTable,
  updateTable,
  deleteTable,
  bulkUpdateTablesLayout,
  updateTableTemplate,
  applyTemplate,
} = require('../controllers/branchController');

// Import bảo mật vào route
const { protect, authorize } = require('../middlewares/authMiddleware');

// =============================================
// BRANCH CRUD
// =============================================

// GET  /api/v1/branches    -> Danh sách chi nhánh (Public)
// POST /api/v1/branches    -> Tạo chi nhánh (Chỉ ADMIN)
router.route('/')
  .get(getAllBranches)
  .post(protect, authorize('ADMIN'), createBranch);

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

// =============================================
// ZONE CRUD (Embedded in Branch)
// =============================================

// GET  /api/v1/branches/:branchId/zones     -> Danh sách zones của branch
// POST /api/v1/branches/:branchId/zones     -> Thêm zone mới
router.route('/:branchId/zones')
  .get(protect, authorize('ADMIN', 'MANAGER'), getZonesByBranch)
  .post(protect, authorize('ADMIN', 'MANAGER'), addZone);

// PUT    /api/v1/branches/:branchId/zones/:zoneId -> Cập nhật zone
// DELETE /api/v1/branches/:branchId/zones/:zoneId -> Xóa zone
router.route('/:branchId/zones/:zoneId')
  .put(protect, authorize('ADMIN', 'MANAGER'), updateZone)
  .delete(protect, authorize('ADMIN', 'MANAGER'), deleteZone);

// =============================================
// TABLE CRUD (Embedded in Zone)
// =============================================

// PUT /api/v1/branches/:branchId/zones/:zoneId/tables/layout -> Cập nhật layout bàn hàng loạt
router.put(
  '/:branchId/zones/:zoneId/tables/layout',
  protect,
  authorize('ADMIN', 'MANAGER'),
  bulkUpdateTablesLayout
);

// POST /api/v1/branches/:branchId/zones/:zoneId/tables -> Thêm bàn mới
router.route('/:branchId/zones/:zoneId/tables')
  .post(protect, authorize('ADMIN', 'MANAGER'), addTable);

// PUT    /api/v1/branches/:branchId/zones/:zoneId/tables/:tableId -> Cập nhật bàn
// DELETE /api/v1/branches/:branchId/zones/:zoneId/tables/:tableId -> Xóa bàn
router.route('/:branchId/zones/:zoneId/tables/:tableId')
  .put(protect, authorize('ADMIN', 'MANAGER'), updateTable)
  .delete(protect, authorize('ADMIN', 'MANAGER'), deleteTable);

// =============================================
// TABLE TEMPLATE CRUD
// =============================================
// PUT /api/v1/branches/:branchId/templates/:templateIndex
router.put(
  '/:branchId/templates/:templateIndex',
  protect,
  authorize('ADMIN', 'MANAGER'),
  updateTableTemplate
);

// =============================================
// IMPORT TEMPLATE
// =============================================
router.post(
  '/:branchId/zones/:zoneId/apply-template',
  protect,
  authorize('ADMIN', 'MANAGER'),
  applyTemplate
);

module.exports = router;