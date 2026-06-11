const express = require('express');
const router = express.Router();
const {
  getAllMenus,
  createMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');

// MỞ KHÓA MIDDLEWARE
const { protect, authorize } = require('../middlewares/authMiddleware');

// GET  /api/v1/menus  -> Danh sách menu (Public - Ai cũng xem được)
// POST /api/v1/menus  -> Tạo danh mục menu mới (Chỉ Admin/Manager)
router.route('/')
  .get(getAllMenus)
  .post(protect, authorize('ADMIN', 'MANAGER'), createMenu);

// POST   /api/v1/menus/:menuId/items           -> Thêm món (Admin/Manager)
router.post('/:menuId/items', protect, authorize('ADMIN', 'MANAGER'), addMenuItem);

// PUT    /api/v1/menus/:menuId/items/:itemId   -> Sửa món (Admin/Manager)
// DELETE /api/v1/menus/:menuId/items/:itemId   -> Xóa món (Admin/Manager)
router.route('/:menuId/items/:itemId')
  .put(protect, authorize('ADMIN', 'MANAGER'), updateMenuItem)
  .delete(protect, authorize('ADMIN', 'MANAGER'), deleteMenuItem);

module.exports = router;