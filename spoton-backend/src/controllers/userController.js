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

// @desc   Đổi mật khẩu / Tạo mật khẩu mới
// @route  PUT /api/v1/user/password
// @access Private
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 6 ký tự trở lên.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    // Nếu đã có mật khẩu thì phải kiểm tra oldPassword
    if (user.password_hash) {
      if (!oldPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu cũ.' });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác.' });
      }
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    user.password_hash = hashed;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật mật khẩu thành công.',
    });
  } catch (error) {
    console.error('Lỗi changePassword:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
