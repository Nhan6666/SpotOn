const express = require('express');
const router = express.Router();
const {
  getAllMenus,
  createMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
// const { protect, authorize } = require('../middlewares/authMiddleware');

// GET  /api/v1/menus  -> Danh sách menu (Public, filter by ?branch_id=xxx)
// POST /api/v1/menus  -> Tạo danh mục menu mới (Admin/Manager)
router.route('/')
  .get(getAllMenus)
  .post(createMenu);

// POST   /api/v1/menus/:menuId/items           -> Thêm món
// PUT    /api/v1/menus/:menuId/items/:itemId   -> Sửa món
// DELETE /api/v1/menus/:menuId/items/:itemId   -> Xóa món
router.post('/:menuId/items', addMenuItem);
router.route('/:menuId/items/:itemId')
  .put(updateMenuItem)
  .delete(deleteMenuItem);

module.exports = router;
