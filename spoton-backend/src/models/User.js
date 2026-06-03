const mongoose = require('mongoose');

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
    is_email_verified: { type: Boolean, default: false },
    profile_allergies: { type: String },
    profile_vip_notes: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('User', UserSchema);
