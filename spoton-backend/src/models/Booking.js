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
  method: { type: String, enum: ['VNPAY', 'MOMO', 'CASH', 'BANK_TRANSFER'], default: 'VNPAY' },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  },
  voucher_code: { type: String },
  paid_at: { type: Date },
});

// ---- Sub-schema: Thông tin hoàn tiền ----
const RefundInfoSchema = new mongoose.Schema({
  refund_amount: { type: Number, default: 0 },
  refund_percentage: { type: Number, default: 0 }, // 0, 50, 100
  bank_account_number: { type: String },
  bank_name: { type: String },
  account_holder_name: { type: String },
  refund_proof_url: { type: String }, // Ảnh UNC chuyển khoản (Manager upload)
  refund_completed_at: { type: Date },
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
    shift: { type: String, enum: ['LUNCH', 'DINNER'], required: true }, // Ca đặt bàn
    guest_count: { type: Number, min: 1 },

    // Mã PIN 4 số tự động sinh để iPad tại bàn mở khóa (UC-C14)
    ipad_pin: { type: String },

    // ============================================================
    // BOOKING STATUS — State Machine (Blueprint II.2)
    // ============================================================
    status: {
      type: String,
      enum: [
        'HOLDING',                    // Giai đoạn 1: Khách đang chọn menu (TTL 10 phút)
        'PENDING_PAYMENT',            // Giai đoạn 2: Đang chờ thanh toán cọc (TTL 15 phút)
        'CONFIRMED',                  // Thanh toán thành công, chờ khách đến
        'IN_USE',                     // Khách đã check-in, đang dùng bữa
        'COMPLETED',                  // Đã thanh toán xong, khách ra về
        'CANCELLED',                  // Hủy (mất cọc / chưa cọc)
        'CANCELLED_TIMEOUT',          // Hết thời gian thanh toán (System Worker UC-S01)
        'CANCELLED_REFUND_PENDING',   // Hủy, đang chờ hoàn tiền
        'REFUND_COMPLETED',           // Đã hoàn tiền xong
        'NO_SHOW',                    // Quá giờ 30 phút không đến (System Worker UC-S02)
      ],
      default: 'HOLDING',
    },

    expires_at: { type: Date, index: true }, // Index for fast cron querying, NOT TTL index to prevent silent deletion
    cancellation_reason: { type: String },
    note: { type: String },

    // ============================================================
    // DỮ LIỆU NHÚNG (Embedded Documents)
    // ============================================================
    table_ids: [{ type: mongoose.Schema.Types.ObjectId }], // ID bàn vật lý
    assigned_tables: [AssignedTableSchema],
    order_items: [OrderItemSchema],
    payment_info: { type: PaymentInfoSchema, default: () => ({}) },
    refund_info: { type: RefundInfoSchema, default: undefined },
    applied_voucher_code: { type: String, default: null }, // Mã voucher khách áp dụng lúc đặt (chưa trừ tiền)

    // ============================================================
    // DỮ LIỆU TÀI CHÍNH — Financial Schema Rules (Blueprint II.1)
    // Các trường tách biệt để đối soát kế toán minh bạch
    // ============================================================
    table_deposit_amount: { type: Number, default: 0 },       // Cọc bàn cố định (tùy loại Zone/VIP)
    pre_order_total_amount: { type: Number, default: 0 },     // Tổng tiền pre-order (100%)
    pre_order_deposit_amount: { type: Number, default: 0 },   // Cọc đồ ăn = 50% pre_order_total
    voucher_discount_amount: { type: Number, default: 0 },    // Số tiền giảm sau voucher
    total_deposit_paid: { type: Number, default: 0 },         // BẤT BIẾN sau CONFIRMED
    // Formula: table_deposit + pre_order_deposit - voucher_discount

    final_bill_amount: { type: Number, default: 0 },          // Bill cuối cùng khi checkout
    // Formula: (pre_order_total + additional_order_total) - total_deposit_paid
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

BookingSchema.index({ branch_id: 1, reservation_date: 1, status: 1 });
BookingSchema.index({ branch_id: 1, shift: 1, reservation_date: 1, status: 1 });
BookingSchema.index({ customer_id: 1, created_at: -1 });

module.exports = mongoose.model('Booking', BookingSchema);
