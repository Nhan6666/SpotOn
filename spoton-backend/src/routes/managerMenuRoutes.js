const express = require('express');
const router = express.Router();
const {
  getManagerMenu,
  updateMasterItemOverride,
  addLocalItem,
  updateLocalItem,
  deleteLocalItem
} = require('../controllers/managerMenuController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Tất cả route trong file này đều yêu cầu đăng nhập và có role là MANAGER
router.use(protect, authorize('MANAGER'));

// Lấy toàn bộ Menu cho chi nhánh (Master + Local trộn lại)
router.get('/', getManagerMenu);

// Bật/tắt & Cập nhật tồn kho cho Món ăn của Admin (Master Item)
router.patch('/master/:itemId/override', updateMasterItemOverride);

// Thêm, sửa, xóa món ăn riêng của chi nhánh (Local Item)
router.post('/local', addLocalItem);
router.route('/local/:itemId')
  .put(updateLocalItem)
  .delete(deleteLocalItem);

module.exports = router;
