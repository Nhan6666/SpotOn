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
    if (phone !== undefined) user.phone = phone;
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
    if (role === 'ADMIN' || role === 'CUSTOMER') {
      user.branch_id = null; // Admin và Customer không thuộc chi nhánh cụ thể
    } else if (branch_id) {
      user.branch_id = branch_id;
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


module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserRole,
};
