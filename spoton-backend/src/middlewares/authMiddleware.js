const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =============================================
// MIDDLEWARE: Bảo vệ route (Cần đăng nhập)
// =============================================
const protect = async (req, res, next) => {
  let token;

  // Lấy token từ Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.',
    });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gán user vào request để các controller có thể dùng
    req.user = await User.findById(decoded.id).select('-password_hash');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// =============================================
// MIDDLEWARE: Phân quyền theo Role
// Sử dụng: authorize('ADMIN', 'MANAGER')
// =============================================
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Tài khoản có quyền [${req.user.role}] không được phép thực hiện hành động này.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
