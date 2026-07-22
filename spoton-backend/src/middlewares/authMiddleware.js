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

    // Xử lý riêng cho Token của IPAD (In-Dining Self-Ordering)
    if (decoded.role === 'IPAD') {
      req.user = {
        _id: decoded._id, // Booking ID
        role: 'IPAD',
        branch_id: decoded.branch_id,
        table_ids: decoded.table_ids
      };
      return next();
    }

    // Gán user vào request để các controller có thể dùng
    req.user = await User.findById(decoded.userId || decoded.id).select('-password_hash');

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

// =============================================
// MIDDLEWARE: Tùy chọn xác thực (Cho phép Khách ẩn danh)
// =============================================
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(); // Cho qua nếu không có token
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'IPAD') {
      req.user = {
        _id: decoded._id,
        role: 'IPAD',
        branch_id: decoded.branch_id,
        table_ids: decoded.table_ids
      };
      return next();
    }

    req.user = await User.findById(decoded.userId || decoded.id).select('-password_hash');
    next();
  } catch (error) {
    next(); // Cho qua dù token sai/hết hạn
  }
};

module.exports = { protect, authorize, optionalAuth };
