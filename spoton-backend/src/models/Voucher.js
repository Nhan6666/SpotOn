const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null, // null = Voucher toàn chuỗi
    },
    discount_percentage: { type: Number, min: 0, max: 100 },
    max_discount_amount: { type: Number, min: 0 },
    min_order_value: { type: Number, min: 0, default: 0 },
    valid_from: { type: Date },
    valid_until: { type: Date },
    usage_limit: { type: Number }, // undefined = không giới hạn
    used_count: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Voucher', VoucherSchema);
