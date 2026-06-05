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
const admin = require('../config/firebaseSetup');

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
    let email = req.body.email;

    email = normalizeEmail(email);

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

    // mật khẩu
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
    let email = req.body.email;

    email = normalizeEmail(email);

    // Kiểm tra xem người dùng có nhập đủ thông tin không
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp cả email và mật khẩu.',
      });
    }

    // Tìm User trong Database theo email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
      });
    }

    // Kiểm tra xem tài khoản đăng nhập bằng Google hay Local
    if (user.auth_provider === 'GOOGLE' && !user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này được đăng ký bằng Google. Vui lòng sử dụng tính năng Đăng nhập bằng Google.',
      });
    }

    // So sánh mật khẩu người dùng nhập vào với mật khẩu đã băm trong DB
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
      });
    }

    // Kiểm tra xem User đã xác thực Email (OTP) chưa
    if (!user.is_email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email để xác thực.',
        data: { email: user.email }
      });
    }

    // Nếu mọi thứ OK, tiến hành cấp Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'spoton_default_secret',
      { expiresIn: '7d' } // Token có hạn 7 ngày
    );

    // Trả kết quả về cho Frontend
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_email_verified: user.is_email_verified
      }
    });

  } catch (error) {
    console.error('Lỗi Login:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server nội bộ.',
    });
  }
};


// @desc   Đăng nhập / Đăng ký bằng Google OAuth
// @route  POST /api/v1/auth/google
// @access Public
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Thiếu token xác thực từ Google.' });
    }

    // 1. Dùng Firebase Admin để bóc tách và xác minh idToken
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Nếu token thật, lấy thông tin từ Google
    const { email, name, picture, uid } = decodedToken;

    // 2. Làm sạch email (loại bỏ dấu . và chữ sau dấu +)
    const cleanEmail = normalizeEmail(email);

    // 3. Tìm User trong Database SpotOn
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // TRƯỜNG HỢP A: TÀI KHOẢN ĐÃ TỒN TẠI (Gộp tài khoản)
      user.google_id = uid;
      user.is_email_verified = true; // Auto verify
      await user.save();
    } else {
      // TRƯỜNG HỢP B: TÀI KHOẢN MỚI TINH
      user = new User({
        full_name: name || 'Người dùng Google',
        email: cleanEmail,
        auth_provider: 'GOOGLE', 
        google_id: uid,
        is_email_verified: true, // Google đã chứng nhận nên auto true
      });
      await user.save();
    }

    // 4. Cấp Token nội bộ của SpotOn cho khách
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'spoton_default_secret',
      { expiresIn: '7d' } 
    );

    // 5. Trả kết quả về cho Frontend
    res.status(200).json({
      success: true,
      message: 'Đăng nhập bằng Google thành công!',
      token,
      user: {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_email_verified: user.is_email_verified,
        avatar: picture 
      }
    });

  } catch (error) {
    console.error('Lỗi Google Auth:', error);
    res.status(401).json({
      success: false,
      message: 'Xác thực Google thất bại. Token không hợp lệ hoặc đã hết hạn.',
    });
  }
};

// @desc   Lấy thông tin người dùng đang đăng nhập
// @route  GET /api/v1/auth/me
// @access Private
const getMe = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// @desc   Xác thực mã OTP
// @route  POST /api/v1/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1. Tìm mã OTP trong DB
    const otpDoc = await Otp.findOne({ email, otp });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn.' });
    }

    // 2. Tìm User và cập nhật trạng thái xác thực
    const user = await User.findOneAndUpdate(
      { email },
      { is_email_verified: true },
      { new: true }
    );

    // 3. Xóa mã OTP sau khi dùng xong
    await Otp.deleteOne({ _id: otpDoc._id });

    // 4. Cấp Token (Lúc này mới chính thức cho đăng nhập)
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
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

module.exports = { register, login, googleAuth, getMe, verifyOtp };