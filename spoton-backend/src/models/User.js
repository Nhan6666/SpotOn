const mongoose = require('mongoose');

const DEFAULT_AVATAR = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'; // Có thể đổi thành link avatar mặc định của SpotOn

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, default: null }, // Rỗng nếu dùng Google OAuth
    auth_provider: { type: String, enum: ['LOCAL', 'GOOGLE'], default: 'LOCAL' },
    google_id: { type: String, default: null },
    full_name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'WAITER', 'CUSTOMER'],
      default: 'CUSTOMER',
    },
    // BỔ SUNG: Liên kết nhân viên với chi nhánh (null nếu là ADMIN hoặc CUSTOMER)
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null
    },
    avatar: { 
      type: String, 
      default: DEFAULT_AVATAR 
    },
    is_email_verified: { type: Boolean, default: false },
    profile_allergies: { type: String },
    profile_vip_notes: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Gắn biến này vào schema để dễ lấy dùng ở chỗ khác nếu cần
UserSchema.statics.DEFAULT_AVATAR = DEFAULT_AVATAR;

module.exports = mongoose.model('User', UserSchema);