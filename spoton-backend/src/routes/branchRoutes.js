const express = require('express');
const router = express.Router();
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  updateTableStatus,
} = require('../controllers/branchController');
// const { protect, authorize } = require('../middlewares/authMiddleware');

// GET  /api/v1/branches    -> Danh sách chi nhánh (Public)
// POST /api/v1/branches    -> Tạo chi nhánh (Admin only)
router.route('/')
  .get(getAllBranches)
  .post(createBranch);

// GET /api/v1/branches/:id  -> Chi tiết chi nhánh
// PUT /api/v1/branches/:id  -> Cập nhật chi nhánh
router.route('/:id')
  .get(getBranchById)
  .put(updateBranch);

// PATCH /api/v1/branches/:branchId/tables/:tableId/status  -> Đổi trạng thái bàn
router.patch('/:branchId/tables/:tableId/status', updateTableStatus);

module.exports = router;
