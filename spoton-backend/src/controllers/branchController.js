// ============================================================
// BRANCH CONTROLLER
// Xử lý: CRUD chi nhánh, quản lý Zone & Table
// ============================================================
const Branch = require('../models/Branch');

// @desc   Lấy tất cả chi nhánh
// @route  GET /api/v1/branches
// @access Public
const getAllBranches = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Lấy chi nhánh theo ID (bao gồm zones & tables)
// @route  GET /api/v1/branches/:id
// @access Public
const getBranchById = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Tạo chi nhánh mới
// @route  POST /api/v1/branches
// @access Private (ADMIN)
const createBranch = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Cập nhật thông tin chi nhánh
// @route  PUT /api/v1/branches/:id
// @access Private (ADMIN, MANAGER)
const updateBranch = async (req, res) => {
  // TODO: Implement
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Cập nhật trạng thái bàn trong chi nhánh
// @route  PATCH /api/v1/branches/:branchId/tables/:tableId/status
// @access Private (MANAGER, WAITER)
const updateTableStatus = async (req, res) => {
  // TODO: Implement (dùng arrayFilters để update nested document)
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports = { getAllBranches, getBranchById, createBranch, updateBranch, updateTableStatus };
