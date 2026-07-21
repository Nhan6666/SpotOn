const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc   Lấy thông tin profile
// @route  GET /api/v1/user/profile
// @access Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Lỗi getProfile:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// @desc   Cập nhật thông tin profile
// @route  PUT /api/v1/user/profile
// @access Private
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, profile_allergies, profile_vip_notes, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    if (full_name !== undefined) user.full_name = full_name;
    
    // Kiểm tra tính duy nhất của số điện thoại (BR-04)
    if (phone !== undefined && phone !== user.phone) {
      if (phone.trim() !== '') {
        const existingPhone = await User.findOne({ phone: phone.trim(), _id: { $ne: user._id } });
        if (existingPhone) {
          return res.status(409).json({ success: false, message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác.' });
        }
      }
      user.phone = phone.trim();
    }
    if (profile_allergies !== undefined) user.profile_allergies = profile_allergies;
    if (profile_vip_notes !== undefined) user.profile_vip_notes = profile_vip_notes;

    if (avatar) {
      user.avatar = avatar;
      user.has_custom_avatar = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công.',
      data: {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        has_custom_avatar: user.has_custom_avatar,
        profile_allergies: user.profile_allergies,
        profile_vip_notes: user.profile_vip_notes,
      },
    });
  } catch (error) {
    console.error('Lỗi updateProfile:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};


// @desc   Lấy danh sách tất cả users (Admin)
// @route  GET /api/v1/users/admin/list
// @access Private/Admin
const getAllUsers = async (req, res) => {
  try {
    // Populate branch_id để lấy tên chi nhánh
    const users = await User.find({})
      .select('-password_hash')
      .populate('branch_id', 'name address')
      .sort({ created_at: -1 });
      
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Lỗi getAllUsers:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// @desc   Cập nhật Role và Branch cho User
// @route  PUT /api/v1/users/admin/:id/role
// @access Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role, branch_id } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    // Không cho phép tự đổi quyền của chính mình (đề phòng Admin tự giáng cấp)
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự thay đổi quyền của chính mình.' });
    }

    if (role) {
      user.role = role;
    }
    
    // Xử lý branch_id
    const targetRole = role || user.role;
    
    if (['MANAGER', 'WAITER', 'KITCHEN'].includes(targetRole)) {
      if (!branch_id && !user.branch_id) {
        return res.status(400).json({ success: false, message: `Vui lòng chọn chi nhánh phân công cho quyền ${targetRole}.` });
      }
      if (branch_id) {
        user.branch_id = branch_id;
      }
    } else if (targetRole === 'ADMIN' || targetRole === 'CUSTOMER') {
      user.branch_id = null; // Admin và Customer không thuộc chi nhánh cụ thể
    }

    await user.save();
    
    // Populate lại để trả về
    const updatedUser = await User.findById(user._id)
      .select('-password_hash')
      .populate('branch_id', 'name address');

    res.status(200).json({
      success: true,
      message: 'Cập nhật phân quyền thành công.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Lỗi updateUserRole:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// @desc   Admin tạo tài khoản nhân viên (MANAGER/WAITER)
// @route  POST /api/v1/users/admin/create
// @access Private/Admin
const createUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, branch_id } = req.body;

    // Validate bắt buộc
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ họ tên, email, mật khẩu và vai trò.' });
    }

    // Chỉ cho tạo MANAGER, WAITER, hoặc KITCHEN
    if (!['MANAGER', 'WAITER', 'KITCHEN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Chỉ được phép tạo tài khoản Quản lý (MANAGER), Nhân viên (WAITER) hoặc Bếp (KITCHEN).' });
    }

    // MANAGER/WAITER phải có chi nhánh
    if (!branch_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn chi nhánh phân công cho nhân viên.' });
    }

    // Check email trùng
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email đã tồn tại trong hệ thống.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      password_hash,
      auth_provider: 'LOCAL',
      role,
      branch_id,
      is_email_verified: true, // Admin tạo nên mặc định verified
    });

    // Populate branch để trả về
    const populatedUser = await User.findById(newUser._id)
      .select('-password_hash')
      .populate('branch_id', 'name address');

    res.status(201).json({
      success: true,
      message: `Tạo tài khoản ${role} thành công.`,
      data: populatedUser,
    });
  } catch (error) {
    console.error('Lỗi createUser:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo tài khoản.' });
  }
};

// @desc   Admin xóa tài khoản Khách hàng
// @route  DELETE /api/v1/users/admin/:id
// @access Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    if (user.role !== 'CUSTOMER') {
      return res.status(403).json({ success: false, message: 'Chỉ có thể xóa tài khoản Khách hàng (CUSTOMER). Vui lòng thu hồi quyền quản trị trước khi xóa.' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Đã xóa tài khoản "${user.full_name}" thành công.`,
    });
  } catch (error) {
    console.error('Lỗi deleteUser:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa tài khoản.' });
  }
};


module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserRole,
  createUser,
  deleteUser,
};
