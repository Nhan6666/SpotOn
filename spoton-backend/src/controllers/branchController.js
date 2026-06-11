// ============================================================
// BRANCH CONTROLLER
// Xử lý: CRUD chi nhánh, quản lý Zone & Table
// ============================================================
const Branch = require('../models/Branch');
const User = require('../models/User');

// @desc   Lấy tất cả chi nhánh
// @route  GET /api/v1/branches
// @access Public
const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().populate('manager_id', 'full_name email phone');
    res.status(200).json({ 
      success: true, 
      message: 'Lấy danh sách chi nhánh thành công.',
      data: branches 
    });
  } catch (error) {
    console.error('Lỗi getAllBranches:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Lấy chi nhánh theo ID (bao gồm zones & tables)
// @route  GET /api/v1/branches/:id
// @access Public
const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('manager_id', 'full_name email phone');
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }
    res.status(200).json({ 
      success: true, 
      message: 'Lấy thông tin chi nhánh thành công.',
      data: branch 
    });
  } catch (error) {
    console.error('Lỗi getBranchById:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Tạo chi nhánh mới
// @route  POST /api/v1/branches
// @access Private (ADMIN)
const createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ 
      success: true, 
      message: 'Tạo chi nhánh thành công.',
      data: branch 
    });
  } catch (error) {
    console.error('Lỗi createBranch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật thông tin chi nhánh
// @route  PUT /api/v1/branches/:id
// @access Private (ADMIN, MANAGER)
const updateBranch = async (req, res) => {
  try {
    // TÍNH NĂNG PHÂN QUYỀN (Tenant-based Access):
    // Nếu là Manager, chỉ được phép sửa chi nhánh mà họ được phân công quản lý
    if (req.user.role === 'MANAGER' && String(req.user.branch_id) !== String(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông tin của chi nhánh này.'
      });
    }

    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật thông tin chi nhánh thành công.',
      data: branch 
    });
  } catch (error) {
    console.error('Lỗi updateBranch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Xóa chi nhánh
// @route  DELETE /api/v1/branches/:id
// @access Private (ADMIN)
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Xóa chi nhánh thành công.',
      data: {} 
    });
  } catch (error) {
    console.error('Lỗi deleteBranch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật trạng thái bàn trong chi nhánh
// @route  PATCH /api/v1/branches/:branchId/tables/:tableId/status
// @access Private (MANAGER, WAITER)
const updateTableStatus = async (req, res) => {
  try {
    const { branchId, tableId } = req.params;
    const { status } = req.body;

    // TÍNH NĂNG PHÂN QUYỀN (Tenant-based Access):
    // Manager và Waiter chỉ được phép đổi trạng thái bàn ở chi nhánh của mình
    if (['MANAGER', 'WAITER'].includes(req.user.role) && String(req.user.branch_id) !== String(branchId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác trên sơ đồ bàn của chi nhánh này.'
      });
    }

    const branch = await Branch.findOneAndUpdate(
      { _id: branchId },
      { $set: { 'zones.$[].tables.$[table].status': status } },
      {
        arrayFilters: [{ 'table._id': tableId }],
        new: true,
      }
    );

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh hoặc bàn.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật trạng thái bàn thành công.',
      data: branch 
    });
  } catch (error) {
    console.error('Lỗi updateTableStatus:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = { getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch, updateTableStatus };