// ============================================================
// MENU CONTROLLER
// Xử lý: CRUD menu, quản lý items trong từng category
// ============================================================
const Menu = require('../models/Menu');

// @desc   Lấy tất cả danh mục menu (có thể filter theo branch_id)
// @route  GET /api/v1/menus?branch_id=xxx
// @access Public
const getAllMenus = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Tạo danh mục menu mới
// @route  POST /api/v1/menus
// @access Private (ADMIN, MANAGER)
const createMenu = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Thêm món ăn vào danh mục
// @route  POST /api/v1/menus/:menuId/items
// @access Private (ADMIN, MANAGER)
const addMenuItem = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Cập nhật món ăn trong danh mục
// @route  PUT /api/v1/menus/:menuId/items/:itemId
// @access Private (ADMIN, MANAGER)
const updateMenuItem = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Xóa món ăn khỏi danh mục
// @route  DELETE /api/v1/menus/:menuId/items/:itemId
// @access Private (ADMIN, MANAGER)
const deleteMenuItem = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports = { getAllMenus, createMenu, addMenuItem, updateMenuItem, deleteMenuItem };
