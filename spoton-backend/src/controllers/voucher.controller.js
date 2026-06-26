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
