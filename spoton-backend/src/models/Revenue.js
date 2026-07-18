const mongoose = require('mongoose');

const RevenueSchema = new mongoose.Schema({
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  date: { type: Date, required: true }, // Ngày ghi nhận doanh thu (thường là reservation_date hoặc ngày checkout)
  shift: { type: String, enum: ['LUNCH', 'DINNER'], required: true },
  
  // Doanh thu thực tế của đơn hàng (Total Revenue)
  // Công thức: pre_order_total - voucher_discount - adjustments_total
  amount: { type: Number, required: true }, 
  
  // Chi tiết cấu thành để kế toán đối soát
  pre_order_total: { type: Number, default: 0 },
  deposit_paid: { type: Number, default: 0 },
  voucher_discount: { type: Number, default: 0 },
  adjustments_total: { type: Number, default: 0 },
  final_paid_at_checkout: { type: Number, default: 0 }, // Tiền khách trả thêm tại quầy
  
  status: { type: String, enum: ['COMPLETED', 'REFUNDED'], default: 'COMPLETED' },
  created_at: { type: Date, default: Date.now },
});

// Index để truy vấn báo cáo theo ngày nhanh hơn
RevenueSchema.index({ branch_id: 1, date: -1 });

module.exports = mongoose.model('Revenue', RevenueSchema);
