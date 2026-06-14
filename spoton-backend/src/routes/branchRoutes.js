const express = require('express');
const router = express.Router();
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  updateTableStatus,
} = require('../controllers/branchController');

// Import bảo mật vào route
const { protect, authorize } = require('../middlewares/authMiddleware');

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

module.exports = router;