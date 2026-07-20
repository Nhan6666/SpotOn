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
    const branches = await Branch.find()
      .populate('manager_id', 'full_name email phone')
      .populate('amenities');
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
    const branch = await Branch.findById(req.params.id)
      .populate('manager_id', 'full_name email phone')
      .populate('amenities');
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

// @desc   Lấy chi nhánh của người dùng hiện tại (cho Manager/Admin)
// @route  GET /api/v1/branches/my/branch
// @access Private
const getMyBranch = async (req, res) => {
  try {
    let branchId = req.user.branch_id;
    
    // Nếu là ADMIN mà không có branch_id, lấy chi nhánh đầu tiên làm mặc định để quản lý
    if (req.user.role === 'ADMIN' && !branchId) {
      const firstBranch = await Branch.findOne();
      if (firstBranch) {
        branchId = firstBranch._id;
      }
    }

    if (!branchId) {
      return res.status(404).json({ success: false, message: 'Bạn chưa được phân công chi nhánh nào.' });
    }

    const branch = await Branch.findById(branchId)
      .populate('manager_id', 'full_name email phone')
      .populate('amenities');
      
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Lấy thông tin chi nhánh thành công.',
      data: branch 
    });
  } catch (error) {
    console.error('Lỗi getMyBranch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Tạo chi nhánh mới
// @route  POST /api/v1/branches
// @access Private (ADMIN)
const createBranch = async (req, res) => {
  try {
    const branchData = { ...req.body };

    // UC-7.3 BR: Configuration Inheritance
    // Lấy cấu hình mặc định từ SystemConfig nếu có
    if (!branchData.service_periods) {
      const config = await SystemConfig.findOne({ config_key: 'DEFAULT_BOOKING_RULES' });
      if (config && config.config_value) {
        try {
          const parsedConfig = JSON.parse(config.config_value);
          if (parsedConfig.service_periods) {
            branchData.service_periods = parsedConfig.service_periods;
          }
        } catch (e) {
          console.error("Lỗi parse DEFAULT_BOOKING_RULES", e);
        }
      }
    }

    const branch = await Branch.create(branchData);

    // Sync manager
    if (branch.manager_id) {
      await User.findByIdAndUpdate(branch.manager_id, { branch_id: branch._id });
    }

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
    const oldBranch = await Branch.findById(req.params.id);
    if (!oldBranch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

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
    }).populate('manager_id', 'full_name email phone');

    // Sync manager if changed
    if (req.body.manager_id !== undefined && String(oldBranch.manager_id) !== String(req.body.manager_id)) {
      if (oldBranch.manager_id) {
        await User.findByIdAndUpdate(oldBranch.manager_id, { $unset: { branch_id: 1 } });
      }
      if (req.body.manager_id) {
        await User.findByIdAndUpdate(req.body.manager_id, { branch_id: branch._id });
      }
    }

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
    res.status(500).json({ success: false, message: error.message || 'Lỗi server nội bộ.' });
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

// @desc   Lấy danh sách các loại sức chứa bàn (capacity) trong hệ thống
// @route  GET /api/v1/branches/table-capacities
// @access Public
const getTableCapacities = async (req, res) => {
  try {
    const branches = await Branch.find({}, 'zones.tables.capacity');
    const capacities = new Set();
    
    branches.forEach(branch => {
      branch.zones?.forEach(zone => {
        zone.tables?.forEach(table => {
          if (table.capacity) capacities.add(table.capacity);
        });
      });
    });

    // Chỉ lấy đúng những gì có trong DB
    const sortedCapacities = Array.from(capacities).sort((a, b) => a - b);

    res.status(200).json({
      success: true,
      data: sortedCapacities
    });
  } catch (error) {
    console.error('Lỗi getTableCapacities:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};


module.exports = {
  getAllBranches,
  getBranchById,
  getMyBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  getTableCapacities
};
