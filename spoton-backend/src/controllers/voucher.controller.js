const Voucher = require('../models/Voucher');

// Helpers
const isVoucherRunning = (voucher) => {
  const now = new Date();
  const validFrom = new Date(voucher.valid_from);
  const validUntil = new Date(voucher.valid_until);
  return voucher.is_active && now >= validFrom && now <= validUntil;
};

// @desc    Get all vouchers
// @route   GET /api/v1/vouchers
// @access  Private/Admin,Manager
exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ created_at: -1 });
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách voucher thành công',
      data: vouchers,
    });
  } catch (error) {
    console.error('Error in getAllVouchers:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách voucher' });
  }
};

// @desc    Get single voucher
// @route   GET /api/v1/vouchers/:id
// @access  Private/Admin,Manager
exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
    }
    res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    console.error('Error in getVoucherById:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy voucher' });
  }
};

// @desc    Get all active global vouchers
// @route   GET /api/v1/vouchers/public/global
// @access  Public
exports.getPublicGlobalVouchers = async (req, res) => {
  try {
    const now = new Date();
    const query = {
      is_active: true,
      branch_id: null,
      valid_from: { $lte: now },
      valid_until: { $gte: now },
    };

    const vouchers = await Voucher.find(query).sort({ valid_until: 1 });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách ưu đãi toàn hệ thống thành công',
      data: vouchers,
    });
  } catch (error) {
    console.error('Error in getPublicGlobalVouchers:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy ưu đãi' });
  }
};

// @desc    Get public vouchers by branch
// @route   GET /api/v1/vouchers/public/branch/:branchId
// @access  Public
exports.getPublicVouchersByBranch = async (req, res) => {
  try {
    const Branch = require('../models/Branch');
    const branch = await Branch.findById(req.params.branchId);
    
    let query = {
      is_active: true,
      $or: [{ branch_id: null }, { branch_id: req.params.branchId }]
    };

    if (branch && branch.disabled_vouchers && branch.disabled_vouchers.length > 0) {
      query._id = { $nin: branch.disabled_vouchers };
    }

    const vouchers = await Voucher.find(query).sort({ created_at: -1 });
    
    // Filter only running vouchers
    const runningVouchers = vouchers.filter(isVoucherRunning);

    res.status(200).json({
      success: true,
      data: runningVouchers,
    });
  } catch (error) {
    console.error('Error in getPublicVouchersByBranch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy voucher public' });
  }
};

// @desc    Create new voucher
// @route   POST /api/v1/vouchers
// @access  Private/Admin,Manager
exports.createVoucher = async (req, res) => {
  try {
    const existing = await Voucher.findOne({ code: req.body.code?.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mã voucher đã tồn tại' });
    }

    const voucher = await Voucher.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo voucher thành công',
      data: voucher,
    });
  } catch (error) {
    console.error('Error in createVoucher:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo voucher' });
  }
};

// @desc    Update a voucher
// @route   PUT /api/v1/vouchers/:id
// @access  Private/Admin,Manager
exports.updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
    }

    // Business Rule: Khóa dữ liệu nhạy cảm nếu voucher đang chạy
    if (isVoucherRunning(voucher)) {
      const sensitiveFields = [
        'code',
        'branch_id',
        'discount_percentage',
        'max_discount_amount',
        'min_order_value',
        'valid_from'
      ];

      for (const field of sensitiveFields) {
        if (req.body[field] !== undefined && req.body[field] !== voucher[field]?.toString()) {
          // Chỉ chặn nếu req.body truyền field mới và nó khác với data cũ (sơ bộ)
          return res.status(400).json({ 
            success: false, 
            message: `Voucher đang phát hành, không thể chỉnh sửa trường ${field}` 
          });
        }
      }
    }

    // Nếu sửa code, kiểm tra code có bị trùng với voucher khác không
    if (req.body.code && req.body.code.toUpperCase() !== voucher.code) {
      const existing = await Voucher.findOne({ code: req.body.code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Mã voucher đã tồn tại' });
      }
    }

    const updatedVoucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật voucher thành công',
      data: updatedVoucher,
    });
  } catch (error) {
    console.error('Error in updateVoucher:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật voucher' });
  }
};

// @desc    Delete a voucher
// @route   DELETE /api/v1/vouchers/:id
// @access  Private/Admin,Manager
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
    }

    // Business Rule: Không cho xóa voucher đang chạy
    if (isVoucherRunning(voucher)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Voucher đang phát hành, không thể xóa. Hãy dùng chức năng Kết thúc sớm.' 
      });
    }

    await Voucher.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa voucher thành công',
      data: {},
    });
  } catch (error) {
    console.error('Error in deleteVoucher:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa voucher' });
  }
};
