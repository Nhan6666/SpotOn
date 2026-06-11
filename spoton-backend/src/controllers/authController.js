// ============================================================
// AUTH CONTROLLER
// Xử lý: Đăng ký, Đăng nhập, Google OAuth, Refresh Token
// ============================================================
const User = require('../models/User');
const Otp = require('../models/Otp'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail'); 
const normalizeEmail = require('../utils/normalizeEmail');

const app = require('../config/firebase');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');

// Hàm phụ trợ: Sinh mã OTP 6 số
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc   Đăng ký tài khoản mới
// @route  POST /api/v1/auth/register
// @access Public
const register = async (req, res) => {
  try {
    const { full_name, phone, password } = req.body;

    const email = normalizeEmail(req.body.email);

    // Kiểm tra xem email hoặc số điện thoại đã tồn tại chưa
    const query = phone && phone.trim() !== '' 
      ? { $or: [{ email }, { phone: phone.trim() }] }
      : { email };

    const existingUser = await User.findOne(query);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email hoặc số điện thoại đã được sử dụng.',
      });
    }

    // Băm mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Tạo User mới trong DB (is_email_verified sẽ tự động là false theo Model)
    const newUser = new User({
      full_name,
      email,
      phone,
      password_hash,
      auth_provider: 'LOCAL',
    });

    await newUser.save();

    // Sinh mã OTP và lưu vào DB (Mã sẽ tự hủy sau 5 phút)
    const otpCode = generateOTP();
    await Otp.create({
      email: newUser.email,
      otp: otpCode,
    });

    // Gửi email chứa mã OTP
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #8a5a19; text-align: center;">Chào mừng đến với SpotOn!</h2>
        <p>Xin chào <strong>${full_name}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất việc đăng ký, vui lòng sử dụng mã xác nhận (OTP) dưới đây:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #333; letter-spacing: 5px; margin: 0;">${otpCode}</h1>
        </div>
        <p style="color: #d9534f; font-size: 14px;"><strong>Lưu ý:</strong> Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777; text-align: center;">Đội ngũ hỗ trợ SpotOn</p>
      </div>
    `;

    // Gửi email chứa mã OTP
    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Mã xác thực tài khoản SpotOn',
        html: emailHtml,
      });
    } catch (emailError) {
      // Hoàn tác: Xóa user và OTP đã tạo nếu không gửi được email
      await User.deleteOne({ _id: newUser._id });
      await Otp.deleteOne({ email: newUser.email });
      throw emailError;
    }

    // Trả kết quả về Frontend (Yêu cầu xác thực OTP, chưa cấp Token vội)
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác nhận.',
      data: {
        email: newUser.email // Gửi kèm email về FE để FE biết user nào đang cần xác thực
      }
    });

  } catch (error) {
    console.error('Lỗi Register:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ.',
    });
  }
};

// @desc   Đăng nhập bằng email & password
// @route  POST /api/v1/auth/login
// @access Public
const login = async (req, res) => {
  try {
    const { password } = req.body;

    const email = normalizeEmail(req.body.email);

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    // Kiểm tra xem đã xác thực email chưa
    if (!user.is_email_verified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để nhập OTP.',
        data: { email: user.email, needsVerification: true }
      });
    }

    // Cấp JWT Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'spoton_default_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: {
        token,
        user: { 
          _id: user._id, 
          email: user.email, 
          full_name: user.full_name, 
          role: user.role,
          avatar: user.avatar
        }
      }
    });

  } catch (error) {
    console.error('Lỗi Login:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Đăng nhập / Đăng ký bằng Google OAuth
// @route  POST /api/v1/auth/google
// @access Public
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu idToken từ client.',
      });
    }

    
    const decodedToken = await getAuth(app).verifyIdToken(idToken);

    const { email, name, picture } = decodedToken;

    // Chuẩn hóa email lấy từ Google (áp dụng logic xóa dấu chấm/cộng)
    const normalizedEmail = normalizeEmail(email);

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // TRƯỜNG HỢP 1: User hoàn toàn mới -> Tạo tài khoản tự động
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(randomPassword, salt);

      user = new User({
        full_name: name,
        email: normalizedEmail,
        password_hash: password_hash,
        auth_provider: 'GOOGLE', // Đánh dấu nguồn đăng nhập
        is_email_verified: true, // Google đã xác thực email này rồi, set true luôn
        avatar: picture || "",
      });

      await user.save();
    } else {
      // TRƯỜNG HỢP 2: User đã tồn tại 
      // (Có thể họ từng đăng ký bằng Form thường trước đây nhưng chưa kịp xác thực OTP)
      
      let isUpdated = false;

      // Nếu trước đây họ đăng ký thường mà chưa xác thực, 
      // giờ họ dùng chính Google của email đó để login -> Duyệt cho họ đã xác thực luôn.
      if (!user.is_email_verified) {
        user.is_email_verified = true;
        isUpdated = true;
      }

      if (user.auth_provider === 'LOCAL') {
         user.auth_provider = 'GOOGLE';
         isUpdated = true;
      }

      // ưu tiên Avatar:
      if (picture && !user.avatar) {
        user.avatar = picture;
        isUpdated = true;
      }

      if (isUpdated) {
        await user.save();
      }
    }

    // Cấp JWT Token của hệ thống SpotOn
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'spoton_default_secret',
      { expiresIn: '7d' }
    );

    // Trả về response chuẩn
    res.status(200).json({
      success: true,
      message: 'Đăng nhập Google thành công.',
      data: {
        token,
        user: { 
          _id: user._id, 
          email: user.email, 
          full_name: user.full_name, 
          role: user.role,
          avatar: user.avatar // Trả về ảnh đại diện nếu có
        }
      }
    });

  } catch (error) {
    console.error('Lỗi Google Auth:', error);
    
    // Bắt lỗi cụ thể từ Firebase (ví dụ: token hết hạn, token bị chế độ)
    if (error.code && error.code.startsWith('auth/')) {
      return res.status(401).json({
        success: false,
        message: 'Xác thực Google thất bại hoặc phiên đăng nhập đã hết hạn.'
      });
    }

    // Lỗi khác (database, logic, v.v...)
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi hệ thống khi xác thực Google.'
    });

    res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ.',
    });
  }
};

// @desc   Lấy thông tin người dùng đang đăng nhập
// @route  GET /api/v1/auth/me
// @access Private
const getMe = async (req, res) => {
  try {
    // Sử dụng trực tiếp req.user đã được gán từ authMiddleware để tối ưu hiệu suất (không cần gọi DB lần 2)
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Lấy thông tin tài khoản thành công.',
      data: user 
    });
  } catch (error) {
    console.error('Lỗi GetMe:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Xác thực mã OTP
// @route  POST /api/v1/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    
    const email = normalizeEmail(req.body.email);

    // Tìm mã OTP trong DB bằng email chuẩn hóa
    const otpDoc = await Otp.findOne({ email, otp });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn.' });
    }

    // Tìm User và cập nhật trạng thái xác thực
    const user = await User.findOneAndUpdate(
      { email },
      { is_email_verified: true },
      { new: true }
    );

    // Xóa mã OTP sau khi dùng xong
    await Otp.deleteOne({ _id: otpDoc._id });

    // Cấp Token (Lúc này mới chính thức cho đăng nhập)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'spoton_default_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Xác thực thành công!',
      token, 
      user: { _id: user._id, email: user.email, full_name: user.full_name, role: user.role }
    });
  } catch (error) {
    console.error('Lỗi Verify OTP:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

module.exports = { register, login, googleAuth, getMe, verifyOtp };