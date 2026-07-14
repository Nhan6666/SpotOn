const Booking = require('../models/Booking');
const Voucher = require('../models/Voucher');

class PaymentService {
  /**
   * Tính toán tiền cọc và giảm giá từ Voucher (Dùng chung)
   * @param {string} bookingId 
   * @param {string} voucherCode 
   * @returns {Object} { tableDeposit, preOrderTotal, preOrderDeposit, voucherDiscount, totalDeposit, appliedVoucher, booking }
   */
  static async calculateDepositData(bookingId, voucherCode = null, applyVoucherUsage = false) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err = new Error('Không tìm thấy đơn đặt bàn.');
      err.statusCode = 404;
      throw err;
    }

    if (booking.status !== 'HOLDING') {
      const err = new Error('Đơn đặt bàn không ở trạng thái cho phép tính cọc.');
      err.statusCode = 400;
      throw err;
    }

    const tableDeposit = 50000;

    const preOrderTotal = (booking.order_items || [])
      .filter(item => item.type === 'PRE_ORDER')
      .reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);

    const preOrderDeposit = Math.ceil(preOrderTotal * 0.5);

    let voucherDiscount = 0;
    let appliedVoucher = null;

    if (voucherCode) {
      const query = {
        code: voucherCode.toUpperCase().trim(),
        is_active: true,
        valid_from: { $lte: new Date() },
        valid_until: { $gte: new Date() },
      };

      // Chỉ read để tính toán preview (calculate-deposit) và lưu thông tin
      const voucher = await Voucher.findOne(query);

      if (!voucher) {
        const err = new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
        err.statusCode = 400;
        throw err;
      }

      if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        const err = new Error('Mã giảm giá đã hết lượt sử dụng.');
        err.statusCode = 400;
        throw err;
      }

      if (voucher.branch_id && String(voucher.branch_id) !== String(booking.branch_id)) {
        const err = new Error('Mã giảm giá không áp dụng cho chi nhánh này.');
        err.statusCode = 400;
        throw err;
      }

      if (preOrderTotal < voucher.min_order_value) {
        const err = new Error(`Đơn hàng tối thiểu ${voucher.min_order_value.toLocaleString()}đ để sử dụng mã này.`);
        err.statusCode = 400;
        throw err;
      }

      voucherDiscount = Math.ceil(preOrderTotal * (voucher.discount_percentage / 100));
      if (voucher.max_discount_amount && voucherDiscount > voucher.max_discount_amount) {
        voucherDiscount = voucher.max_discount_amount;
      }

      appliedVoucher = {
        code: voucher.code,
        discount_percentage: voucher.discount_percentage,
        discount_amount: voucherDiscount,
      };
    }

    // Thay đổi luồng: Voucher KHÔNG trừ vào tiền cọc, chỉ ghi nhận để trừ vào hóa đơn cuối cùng
    const totalDeposit = tableDeposit + preOrderDeposit;

    return {
      tableDeposit,
      preOrderTotal,
      preOrderDeposit,
      voucherDiscount, // Trả về để frontend hiển thị số tiền sẽ được giảm, nhưng không trừ vào cọc
      totalDeposit,
      appliedVoucher,
      booking
    };
  }
}

module.exports = PaymentService;
