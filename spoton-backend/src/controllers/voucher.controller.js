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
    let query = {};
    // Phân quyền: MANAGER chỉ lấy voucher của chi nhánh họ quản lý
    if (req.user && req.user.role === 'MANAGER') {
      query.branch_id = req.user.branch_id;
    }
    const vouchers = await Voucher.find(query)
      .populate('branch_id', 'name')
      .sort({ created_at: -1 });
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
      is_public: true, // Chỉ lấy voucher được public (không bị đóng rèm)
      branch_id: null,
      valid_from: { $lte: now },
      valid_until: { $gte: now },
      $expr: {
        $or: [
          { $eq: ["$usage_limit", null] },
          { $lt: ["$used_count", "$usage_limit"] }
        ]
      }
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
      is_public: true, // Chỉ lấy voucher được public
      $or: [{ branch_id: null }, { branch_id: req.params.branchId }],
      valid_until: { $gte: new Date() },
      $expr: {
        $or: [
          { $eq: ["$usage_limit", null] },
          { $lt: ["$used_count", "$usage_limit"] }
        ]
      }
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

    // Phân quyền: MANAGER tạo voucher thì ép luôn thuộc về chi nhánh của họ
    if (req.user && req.user.role === 'MANAGER') {
      req.body.branch_id = req.user.branch_id;
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

    // Phân quyền: MANAGER chỉ được sửa voucher của chi nhánh mình
    if (req.user && req.user.role === 'MANAGER' && voucher.branch_id?.toString() !== req.user.branch_id?.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa voucher của chi nhánh khác' });
    }

    // MANAGER nếu cố tình gửi branch_id khác thì ghi đè lại
    if (req.user && req.user.role === 'MANAGER') {
      req.body.branch_id = req.user.branch_id;
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
        if (req.body[field] !== undefined) {
          let bodyVal = req.body[field];
          let dbVal = voucher[field];

          if (field === 'valid_from') {
            const bodyTime = new Date(bodyVal).getTime();
            const dbTime = new Date(dbVal).getTime();
            if (!isNaN(bodyTime) && !isNaN(dbTime) && bodyTime !== dbTime) {
              return res.status(400).json({ 
                success: false, 
                message: `Voucher đang phát hành, không thể chỉnh sửa trường ${field}` 
              });
            }
            continue;
          }

          bodyVal = bodyVal === null ? null : String(bodyVal);
          dbVal = dbVal == null ? null : String(dbVal);
          
          if (bodyVal !== dbVal) {
            // Chỉ chặn nếu req.body truyền field mới và nó khác với data cũ (sơ bộ)
            return res.status(400).json({ 
              success: false, 
              message: `Voucher đang phát hành, không thể chỉnh sửa trường ${field}` 
            });
          }
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

    // Phân quyền: MANAGER chỉ được xóa voucher của chi nhánh mình
    if (req.user && req.user.role === 'MANAGER' && voucher.branch_id?.toString() !== req.user.branch_id?.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa voucher của chi nhánh khác' });
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
  }
};

// @desc    Nhận voucher vào ví (Claim voucher)
// @route   POST /api/v1/vouchers/claim
// @access  Private
exports.claimVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    const customer_id = req.user.id; // Lấy từ middleware auth

    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã voucher.' });
    }

    const voucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Mã voucher không tồn tại.' });
    }

    if (!voucher.is_active) {
      return res.status(400).json({ success: false, message: 'Mã voucher đã bị khóa.' });
    }

    // Kiểm tra hết hạn chưa
    const now = new Date();
    if (new Date(voucher.valid_until) < now) {
      return res.status(400).json({ success: false, message: 'Voucher đã hết hạn.' });
    }

    // Kiểm tra đã hết lượt dùng chưa
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ success: false, message: 'Voucher đã hết lượt sử dụng.' });
    }

    const UserVoucher = require('../models/UserVoucher');
    
    // Kiểm tra xem user đã lưu voucher này chưa
    const existingWallet = await UserVoucher.findOne({ customer_id, voucher_id: voucher._id });
    if (existingWallet) {
      return res.status(400).json({ success: false, message: 'Bạn đã lưu voucher này trong ví rồi.' });
    }

    // Lưu vào ví
    await UserVoucher.create({
      customer_id,
      voucher_id: voucher._id,
      status: 'UNUSED'
    });

    res.status(200).json({
      success: true,
      message: 'Nhận voucher thành công! Voucher đã được lưu vào ví.',
      data: voucher
    });

  } catch (error) {
    console.error('Error in claimVoucher:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi nhận voucher.' });
  }
};

// @desc    Lấy ví voucher của user
// @route   GET /api/v1/vouchers/my-wallet
// @access  Private
exports.getMyWallet = async (req, res) => {
  try {
    const customer_id = req.user.id; // User logged in
    const UserVoucher = require('../models/UserVoucher');

    const now = new Date();
    // Lấy tất cả voucher public còn hiệu lực
    const publicVouchers = await Voucher.find({ 
      is_public: true,
      is_active: true,
      valid_until: { $gte: now },
      $expr: {
        $or: [
          { $eq: ["$usage_limit", null] },
          { $lt: ["$used_count", "$usage_limit"] }
        ]
      }
    })
      .populate('branch_id', 'name')
      .sort({ createdAt: -1 });
    
    // Lấy trạng thái sử dụng của user này
    const userVouchers = await UserVoucher.find({ customer_id }).populate({
      path: 'voucher_id',
      populate: { path: 'branch_id', select: 'name' }
    });

    const wallet = publicVouchers.map(voucher => {
      // Kiểm tra xem user đã dùng voucher này chưa
      const userV = userVouchers.find(uv => uv.voucher_id && uv.voucher_id._id.toString() === voucher._id.toString());
      
      return {
        _id: userV ? userV._id : `virtual_${voucher._id}`,
        status: userV ? userV.status : 'UNUSED',
        voucher_id: voucher
      };
    });

    // Thêm các voucher private mà user đã lưu (nếu có lỡ lưu trước đó)
    userVouchers.forEach(uv => {
      if (uv.voucher_id && !uv.voucher_id.is_public) {
        wallet.push(uv);
      }
    });

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy ví voucher',
      error: error.message
    });
  }
};

// @desc    Lấy ví voucher của user theo ID (dành cho Manager)
// @route   GET /api/v1/vouchers/wallet/:customerId
// @access  Private (Manager/Admin)
exports.getWalletByCustomerId = async (req, res) => {
  try {
    let customer_id = req.params.customerId;
    const UserVoucher = require('../models/UserVoucher');
    
    // Nếu customer_id có dạng số điện thoại, thử tìm User
    if (/^\d{10,11}$/.test(customer_id)) {
      const User = require('../models/User');
      const user = await User.findOne({ phone: customer_id });
      if (user) {
        customer_id = user._id;
      } else {
        // Khách vãng lai chưa từng đăng ký tài khoản -> không có ví
        return res.status(200).json({ success: true, data: [] });
      }
    }

    const now = new Date();
    // Lấy tất cả voucher public còn hiệu lực
    const publicVouchers = await Voucher.find({ 
      is_public: true,
      is_active: true,
      valid_until: { $gte: now },
      $expr: {
        $or: [
          { $eq: ["$usage_limit", null] },
          { $lt: ["$used_count", "$usage_limit"] }
        ]
      }
    })
      .populate('branch_id', 'name')
      .sort({ createdAt: -1 });
    
    // Lấy trạng thái sử dụng của user này
    const userVouchers = await UserVoucher.find({ customer_id }).populate({
      path: 'voucher_id',
      populate: { path: 'branch_id', select: 'name' }
    });

    const wallet = publicVouchers.map(voucher => {
      // Kiểm tra xem user đã dùng voucher này chưa
      const userV = userVouchers.find(uv => uv.voucher_id && uv.voucher_id._id.toString() === voucher._id.toString());
      
      return {
        _id: userV ? userV._id : `virtual_${voucher._id}`,
        status: userV ? userV.status : 'UNUSED',
        voucher_id: voucher
      };
    });

    // Thêm các voucher private mà user đã lưu (nếu có lỡ lưu trước đó)
    userVouchers.forEach(uv => {
      if (uv.voucher_id && !uv.voucher_id.is_public) {
        wallet.push(uv);
      }
    });

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy ví voucher của khách hàng',
      error: error.message
    });
  }
};
// @desc    Validate voucher (Dùng khi đặt bàn để check xem có hợp lệ không)
// @route   POST /api/v1/vouchers/validate
// @access  Public / Private (Khách có thể validate lúc đặt bàn chưa cần đăng nhập nếu walk-in)
exports.validateVoucher = async (req, res) => {
  try {
    const { code, branch_id, guest_count, pre_order_amount, customer_id } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã voucher.' });
    }

    const voucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Mã voucher không hợp lệ.' });
    }

    if (!voucher.is_active) {
      return res.status(400).json({ success: false, message: 'Mã voucher đã bị khóa.' });
    }

    const now = new Date();
    if (new Date(voucher.valid_from) > now) {
      return res.status(400).json({ success: false, message: 'Voucher chưa đến thời gian áp dụng.' });
    }
    if (new Date(voucher.valid_until) < now) {
      return res.status(400).json({ success: false, message: 'Voucher đã hết hạn.' });
    }

    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ success: false, message: 'Voucher đã hết lượt sử dụng.' });
    }

    // Check branch
    if (voucher.branch_id && branch_id) {
      if (voucher.branch_id.toString() !== branch_id.toString()) {
        return res.status(400).json({ success: false, message: 'Voucher không áp dụng cho chi nhánh này.' });
      }
    }

    // Check guest count
    if (voucher.min_guest_count && guest_count) {
      if (guest_count < voucher.min_guest_count) {
        return res.status(400).json({ 
          success: false, 
          message: `Voucher chỉ áp dụng cho bàn từ ${voucher.min_guest_count} người trở lên.` 
        });
      }
    }

    // Check min order value
    if (voucher.min_order_value && pre_order_amount !== undefined) {
      if (pre_order_amount < voucher.min_order_value) {
        return res.status(400).json({
          success: false,
          message: `Voucher yêu cầu đơn hàng từ ${voucher.min_order_value.toLocaleString()}đ trở lên.`
        });
      }
    }

    // Check customer usage
    const customerIdToCheck = customer_id || (req.user ? req.user.id : null);
    if (customerIdToCheck) {
      const UserVoucher = require('../models/UserVoucher');
      const userVoucher = await UserVoucher.findOne({
        customer_id: customerIdToCheck,
        voucher_id: voucher._id
      });
      if (userVoucher && userVoucher.status === 'USED') {
        return res.status(400).json({
          success: false,
          message: 'Khách hàng này đã sử dụng mã voucher này rồi.'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Voucher hợp lệ!',
      data: voucher
    });

  } catch (error) {
    console.error('Error in validateVoucher:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi kiểm tra voucher.' });
  }
};
