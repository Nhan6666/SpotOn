const mongoose = require('mongoose');

const UserVoucherSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    voucher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true },
    status: {
      type: String,
      enum: ['UNUSED', 'USED', 'EXPIRED'],
      default: 'UNUSED',
    },
    used_at: { type: Date },
    // Liên kết với booking nếu đã dùng
    used_in_booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Một user chỉ được nhận 1 voucher cụ thể một lần
UserVoucherSchema.index({ customer_id: 1, voucher_id: 1 }, { unique: true });
UserVoucherSchema.index({ customer_id: 1, status: 1 });

module.exports = mongoose.model('UserVoucher', UserVoucherSchema);
