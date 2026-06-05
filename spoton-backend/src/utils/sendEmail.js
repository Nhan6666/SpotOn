const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1. Tạo một transporter (người vận chuyển) kết nối với Gmail
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Định nghĩa nội dung email
    const mailOptions = {
      from: `"SpotOn Restaurant" <${process.env.EMAIL_USER}>`, // Tên người gửi
      to: options.email,        // Email người nhận
      subject: options.subject, // Tiêu đề email
      html: options.html,       // Nội dung email dạng HTML cho đẹp
    };

    // 3. Tiến hành gửi
    await transporter.sendMail(mailOptions);
    console.log(`✅ Đã gửi email thành công tới: ${options.email}`);
  } catch (error) {
    console.error('❌ Lỗi khi gửi email:', error);
    throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
  }
};

module.exports = sendEmail;