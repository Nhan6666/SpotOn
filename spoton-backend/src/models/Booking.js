const mongoose = require('mongoose');

// ---- Sub-schema: Bàn được phân công ----
const AssignedTableSchema = new mongoose.Schema({
  zone_name: { type: String },
  table_number: { type: String },
});

// ---- Sub-schema: Món ăn trong đơn hàng ----
const OrderItemSchema = new mongoose.Schema({
  menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
  name: { type: String }, // Snapshot tên món tại thời điểm đặt
  quantity: { type: Number, min: 1 },
  price_at_time: { type: Number }, // Snapshot giá tại thời điểm đặt
  prep_status: {
    type: String,
    enum: ['PENDING', 'PREPARING', 'READY', 'SERVED'],
    default: 'PENDING',
  },
  type: {
    type: String,
    enum: ['PRE_ORDER', 'ADDITIONAL'], // PRE_ORDER: đặt trước, ADDITIONAL: gọi thêm tại bàn
    default: 'PRE_ORDER',
  },
});

// ---- Sub-schema: Thông tin thanh toán (1-1) ----
const PaymentInfoSchema = new mongoose.Schema({
  transaction_id: { type: String },
  total_amount: { type: Number },
  deposit_amount: { type: Number },
  method: { type: String, enum: ['VNPAY', 'MOMO', 'CASH', 'BANK_TRANSFER'], default: 'VNPAY' },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  },
  voucher_code: { type: String },
  discount_amount: { type: Number, default: 0 },
  paid_at: { type: Date },
});

// ---- Schema cha: Đặt bàn (Booking) ----
const BookingSchema = new mongoose.Schema(
  {
    // Khách hàng: có tài khoản hoặc walk-in
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    walk_in_name: { type: String },
    walk_in_phone: { type: String },

    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    reservation_date: { type: Date, required: true },
    arrival_time: { type: String }, // VD: "19:00"
    guest_count: { type: Number, min: 1 },
    status: {
      type: String,
      enum: ['PENDING_DEPOSIT', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED'],
      default: 'PENDING_DEPOSIT',
    },
    cancellation_reason: { type: String },
    note: { type: String },

    // Dữ liệu nhúng (Embedded)
    assigned_tables: [AssignedTableSchema],
    order_items: [OrderItemSchema],
    payment_info: { type: PaymentInfoSchema, default: () => ({}) }, // Object 1-1
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Booking', BookingSchema);
