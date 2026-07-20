const express = require('express');
const router = express.Router();
const {
  getMasterMenus,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleCoreItem,
  toggleItemVisibility,
} = require('../controllers/masterMenuController');

const {
  getPublicBranchMenu,
  getPublicCategories,
  getPublicMenuItems,
  getPublicBestSellers
} = require('../controllers/publicMenuController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// ============================================================
// PUBLIC ROUTES
// ============================================================
// GET /api/v1/menus/public/best-sellers -> Lấy món best seller
router.get('/public/best-sellers', getPublicBestSellers);

// GET /api/v1/menus/public/:branchId/categories -> Lấy danh sách category cho tab menu
router.get('/public/:branchId/categories', getPublicCategories);

// GET /api/v1/menus/public/:branchId/items -> Lấy món ăn theo category (có phân trang)
router.get('/public/:branchId/items', getPublicMenuItems);

// GET /api/v1/menus/public/branch/:branchId -> Lấy Menu cho khách hàng xem chi tiết chi nhánh (Legacy/Full)
router.get('/public/branch/:branchId', getPublicBranchMenu);

// ============================================================
// ADMIN-ONLY ROUTES (UC-7.3: Master Menu Management)
// ============================================================

// GET  /api/v1/menus/master   -> Lấy toàn bộ Master Menu (Admin)
router.get('/master', protect, authorize('ADMIN'), getMasterMenus);

// POST /api/v1/menus/:menuId/items           -> Thêm món (Admin/Manager)
router.post('/:menuId/items', protect, authorize('ADMIN', 'MANAGER'), addMenuItem);

// PUT    /api/v1/menus/:menuId/items/:itemId   -> Sửa món (Admin/Manager)
// DELETE /api/v1/menus/:menuId/items/:itemId   -> Xóa món (Admin/Manager) [BR-02 enforced]
router.route('/:menuId/items/:itemId')
  .put(protect, authorize('ADMIN', 'MANAGER'), updateMenuItem)
  .delete(protect, authorize('ADMIN', 'MANAGER'), deleteMenuItem);

// PATCH /api/v1/menus/:menuId/items/:itemId/core-lock  -> Toggle Core Item (Admin only) [BR-02]
router.patch(
  '/:menuId/items/:itemId/core-lock',
  protect, authorize('ADMIN'),
  toggleCoreItem
);

// PATCH /api/v1/menus/:menuId/items/:itemId/toggle-visibility -> Ẩn/Hiện món (Admin/Manager)
router.patch(
  '/:menuId/items/:itemId/toggle-visibility',
  protect, authorize('ADMIN', 'MANAGER'),
  toggleItemVisibility
);

module.exports = router;