// ============================================================
// BRANCH CONTROLLER
// Xử lý: CRUD chi nhánh, quản lý Zone & Table
// ============================================================
const Branch = require('../models/Branch');
const User = require('../models/User');

// @desc   Lấy tất cả chi nhánh
// @route  GET /api/v1/branches
// @access Public
const getAllBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find().populate('manager_id', 'full_name email phone');
    res.status(200).json({ success: true, count: branches.length, data: branches });
  } catch (error) {
    next(error);
  }
};

// @desc   Lấy chi nhánh theo ID (bao gồm zones & tables)
// @route  GET /api/v1/branches/:id
// @access Public
const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('manager_id', 'full_name email phone');
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// @desc   Tạo chi nhánh mới
// @route  POST /api/v1/branches
// @access Private (ADMIN)
const createBranch = async (req, res, next) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// @desc   Cập nhật thông tin chi nhánh
// @route  PUT /api/v1/branches/:id
// @access Private (ADMIN, MANAGER)
const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// @desc   Xóa chi nhánh
// @route  DELETE /api/v1/branches/:id
// @access Private (ADMIN)
const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc   Cập nhật trạng thái bàn trong chi nhánh
// @route  PATCH /api/v1/branches/:branchId/tables/:tableId/status
// @access Private (MANAGER, WAITER)
const updateTableStatus = async (req, res, next) => {
  try {
    const { branchId, tableId } = req.params;
    const { status } = req.body;

    const branch = await Branch.findOneAndUpdate(
      { _id: branchId },
      { $set: { 'zones.$[].tables.$[table].status': status } },
      {
        arrayFilters: [{ 'table._id': tableId }],
        new: true,
      }
    );

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch or Table not found' });
    }

    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch, updateTableStatus };
