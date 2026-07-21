// ============================================================
// PAYMENT CONTROLLER — UC-C12: Xử lý thanh toán cọc VNPay/MoMo
// Strategy Pattern: Chọn cổng thanh toán dựa trên method
// ============================================================
const Booking = require('../models/Booking');
const Voucher = require('../models/Voucher');
const vnpayService = require('../services/vnpayService');
const momoService = require('../services/momoService');
const TableLockService = require('../services/tableLockService');
const asyncHandler = require('../utils/asyncHandler');

// ============================================================
// @desc   Tính toán số tiền cọc (Bước 1: Checkout Review)
// @route  POST /api/v1/payment/calculate-deposit
// @access Public (booking phải ở trạng thái HOLDING)
// ============================================================
const calculateDeposit = asyncHandler(async (req, res) => {
  const { booking_id, voucher_code } = req.body;
  const PaymentService = require('../services/PaymentService');

  const {
    tableDeposit,
    preOrderTotal,
    preOrderDeposit,
    voucherDiscount,
    totalDeposit,
    appliedVoucher,
    booking
  } = await PaymentService.calculateDepositData(booking_id, voucher_code, false);

  res.status(200).json({
    success: true,
    message: 'Tính tiền cọc thành công.',
    data: {
      table_deposit_amount: tableDeposit,
      pre_order_total_amount: preOrderTotal,
      pre_order_deposit_amount: preOrderDeposit,
      voucher_discount_amount: voucherDiscount,
      total_deposit: totalDeposit,
      applied_voucher: appliedVoucher,
      order_items: booking.order_items,
      branch_id: booking.branch_id,
    },
  });
});

// ============================================================
// @desc   Tạo URL thanh toán (Bước 2: Redirect sang VNPay/MoMo)
// @route  POST /api/v1/payment/create-payment
// @access Public (booking phải ở trạng thái HOLDING)
// ============================================================
const createPayment = asyncHandler(async (req, res) => {
  const { booking_id, method, voucher_code } = req.body;
  const PaymentService = require('../services/PaymentService');

  if (!['VNPAY', 'MOMO'].includes(method)) {
    const err = new Error('Phương thức thanh toán không hợp lệ. Chọn VNPAY hoặc MOMO.');
    err.statusCode = 400;
    throw err;
  }

  // --- Tính tiền cọc bằng Service ---
  const { 
    tableDeposit, 
    preOrderTotal, 
    preOrderDeposit, 
    voucherDiscount, 
    totalDeposit, 
    booking 
  } = await PaymentService.calculateDepositData(booking_id, voucher_code, true);

  // --- Giai đoạn 2: Gia hạn Redis lock lên 15 phút ---
  const tableIds = booking.table_ids.map(id => id.toString());
  const lockExtended = await TableLockService.extendLockForPayment(
    booking.branch_id.toString(),
    tableIds
  );

  if (!lockExtended) {
    const err = new Error('Đã hết thời gian giữ bàn. Vui lòng thực hiện lại từ đầu.');
    err.statusCode = 410; // Gone
    throw err;
  }

  // --- Cập nhật Booking sang PENDING_PAYMENT ---
  booking.status = 'PENDING_PAYMENT';
  booking.table_deposit_amount = tableDeposit;
  booking.pre_order_total_amount = preOrderTotal;
  booking.pre_order_deposit_amount = preOrderDeposit;
  booking.voucher_discount_amount = voucherDiscount;
  booking.total_deposit_paid = totalDeposit;
  booking.applied_voucher_code = voucher_code || null;
  booking.payment_info = {
    method,
    status: 'PENDING',
    voucher_code: voucher_code || undefined,
  };
  // Gia hạn expires_at lên 15 phút
  booking.expires_at = new Date(Date.now() + 15 * 60000);
  await booking.save();

  // --- Phát WebSocket thông báo bàn đang PENDING_PAYMENT ---
  const io = require('../socket').getIO();
  io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
    action: 'PENDING_PAYMENT',
    branch_id: booking.branch_id,
    booking_id: booking._id,
    table_ids: tableIds,
  });

  // --- Strategy Pattern: Tạo URL theo method ---
  let paymentResult;

  if (method === 'VNPAY') {
    const ipAddr = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';
    paymentResult = vnpayService.createPaymentUrl({
      bookingId: booking._id.toString(),
      amount: totalDeposit,
      orderInfo: `Coc dat ban SpotOn #${booking._id}`,
      ipAddr,
    });
  } else if (method === 'MOMO') {
    paymentResult = await momoService.createPaymentUrl({
      bookingId: booking._id.toString(),
      amount: totalDeposit,
      orderInfo: `Coc dat ban SpotOn #${booking._id}`,
    });
  }

  // Lưu txnRef/orderId vào payment_info
  booking.payment_info.transaction_id = paymentResult.txnRef || paymentResult.orderId;
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Tạo URL thanh toán thành công. Vui lòng chuyển hướng khách.',
    data: {
      payment_url: paymentResult.paymentUrl,
      transaction_ref: paymentResult.txnRef || paymentResult.orderId,
      total_deposit: totalDeposit,
      method,
      expires_in_seconds: 900, // 15 phút
    },
  });
});

// ============================================================
// @desc   VNPay IPN Webhook (Bước 3: VNPay gọi ngầm về server)
// @route  GET /api/v1/payment/vnpay-ipn
// @access Public (VNPay gọi, không cần auth)
// ============================================================
const handleVNPayIPN = asyncHandler(async (req, res) => {
  const result = vnpayService.verifyReturnUrl(req.query);

  if (!result.isValid) {
    return res.status(200).json({ RspCode: '97', Message: 'Invalid checksum' });
  }

  // Trích xuất bookingId từ txnRef (format: bookingId_timestamp)
  const bookingId = result.txnRef.split('_')[0];
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return res.status(200).json({ RspCode: '01', Message: 'Booking not found' });
  }

  if (booking.status !== 'PENDING_PAYMENT') {
    return res.status(200).json({ RspCode: '02', Message: 'Booking already processed' });
  }

  if (result.responseCode === '00') {
    // === THANH TOÁN THÀNH CÔNG ===
    booking.status = 'CONFIRMED';
    booking.payment_info.status = 'PAID';
    booking.payment_info.transaction_id = result.transactionId;
    booking.payment_info.paid_at = new Date();
    booking.expires_at = undefined; // Xóa TTL, booking sống vĩnh viễn

    await booking.save();
    
    // === TRỪ TỒN KHO MÓN ĂN KHI THANH TOÁN THÀNH CÔNG ===
    if (booking.order_items && booking.order_items.length > 0) {
      const BookingService = require('../services/bookingService');
      await BookingService.syncInventory(booking.order_items, booking.branch_id, true);
    }

    // Xóa Redis lock (bàn đã chính thức được đặt)
    await TableLockService.unlockTables(
      booking.branch_id.toString(),
      booking.table_ids.map(id => id.toString())
    );

    // Phát WebSocket
    const io = require('../socket').getIO();
    io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
      action: 'CONFIRMED',
      branch_id: booking.branch_id,
      booking_id: booking._id,
      table_ids: booking.table_ids,
    });

    console.log(`✅ VNPay: Booking ${bookingId} CONFIRMED. TxnID: ${result.transactionId}`);
  } else {
    // === THANH TOÁN THẤT BẠI ===
    booking.status = 'CANCELLED_PAYMENT_FAILED';
    booking.payment_info.status = 'FAILED';
    booking.expires_at = undefined;
    await booking.save();
    
    // Nhả bàn ngay lập tức (giải quyết rủi ro D)
    await TableLockService.unlockTables(
      booking.branch_id.toString(),
      booking.table_ids.map(id => id.toString())
    );

    const io = require('../socket').getIO();
    io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
      action: 'CANCELLED_PAYMENT_FAILED',
      branch_id: booking.branch_id,
      booking_id: booking._id,
      table_ids: booking.table_ids,
    });

    console.log(`❌ VNPay: Booking ${bookingId} payment failed and tables released. Code: ${result.responseCode}`);
  }

  // VNPay yêu cầu trả về format chuẩn
  res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
});

// ============================================================
// @desc   MoMo IPN Webhook (Bước 3: MoMo gọi ngầm về server)
// @route  POST /api/v1/payment/momo-ipn
// @access Public (MoMo gọi, không cần auth)
// ============================================================
const handleMoMoIPN = asyncHandler(async (req, res) => {
  const result = momoService.verifyIPN(req.body);

  if (!result.isValid) {
    return res.status(200).json({ message: 'Invalid signature' });
  }

  // Trích xuất bookingId từ extraData
  let bookingId;
  try {
    const extra = JSON.parse(Buffer.from(result.extraData, 'base64').toString());
    bookingId = extra.bookingId;
  } catch {
    // Fallback: trích từ orderId (format: SPOTON_bookingId_timestamp)
    bookingId = result.orderId.split('_')[1];
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(200).json({ message: 'Booking not found' });
  }

  if (booking.status !== 'PENDING_PAYMENT') {
    return res.status(200).json({ message: 'Booking already processed' });
  }

  if (result.resultCode === 0) {
    // === THANH TOÁN THÀNH CÔNG ===
    booking.status = 'CONFIRMED';
    booking.payment_info.status = 'PAID';
    booking.payment_info.transaction_id = result.transactionId;
    booking.payment_info.paid_at = new Date();
    booking.expires_at = undefined;

    await booking.save();

    // === TRỪ TỒN KHO MÓN ĂN KHI THANH TOÁN THÀNH CÔNG ===
    if (booking.order_items && booking.order_items.length > 0) {
      const BookingService = require('../services/bookingService');
      await BookingService.syncInventory(booking.order_items, booking.branch_id, true);
    }

    await TableLockService.unlockTables(
      booking.branch_id.toString(),
      booking.table_ids.map(id => id.toString())
    );

    const io = require('../socket').getIO();
    io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
      action: 'CONFIRMED',
      branch_id: booking.branch_id,
      booking_id: booking._id,
      table_ids: booking.table_ids,
    });

    console.log(`✅ MoMo: Booking ${bookingId} CONFIRMED. TxnID: ${result.transactionId}`);
  } else {
    // === THANH TOÁN THẤT BẠI ===
    booking.status = 'CANCELLED_PAYMENT_FAILED';
    booking.payment_info.status = 'FAILED';
    booking.expires_at = undefined;
    await booking.save();
    
    // Nhả bàn ngay lập tức (giải quyết rủi ro D)
    await TableLockService.unlockTables(
      booking.branch_id.toString(),
      booking.table_ids.map(id => id.toString())
    );

    const io = require('../socket').getIO();
    io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
      action: 'CANCELLED_PAYMENT_FAILED',
      branch_id: booking.branch_id,
      booking_id: booking._id,
      table_ids: booking.table_ids,
    });

    console.log(`❌ MoMo: Booking ${bookingId} payment failed and tables released. Code: ${result.resultCode}`);
  }

  res.status(200).json({ message: 'OK' });
});

// ============================================================
// @desc   VNPay Return URL (Bước 4: Khách quay lại sau thanh toán)
// @route  GET /api/v1/payment/vnpay-return
// @access Public
// ============================================================
const handleVNPayReturn = asyncHandler(async (req, res) => {
  const result = vnpayService.verifyReturnUrl(req.query);
  const bookingId = result.txnRef.split('_')[0];

  // Xử lý cập nhật DB ngay tại Return (Phòng trường hợp localhost không nhận được IPN)
  if (result.isValid) {
    const booking = await Booking.findById(bookingId);
    if (booking && booking.status === 'PENDING_PAYMENT') {
      if (result.responseCode === '00') {
        booking.status = 'CONFIRMED';
        booking.payment_info.status = 'PAID';
        booking.payment_info.transaction_id = result.transactionId;
        booking.payment_info.paid_at = new Date();
        booking.expires_at = undefined;
        await booking.save();

        // === TRỪ TỒN KHO MÓN ĂN KHI THANH TOÁN THÀNH CÔNG ===
        if (booking.order_items && booking.order_items.length > 0) {
          const BookingService = require('../services/bookingService');
          await BookingService.syncInventory(booking.order_items, booking.branch_id, true);
        }

        await TableLockService.unlockTables(
          booking.branch_id.toString(),
          booking.table_ids.map(id => id.toString())
        );

        const io = require('../socket').getIO();
        io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
          action: 'CONFIRMED',
          branch_id: booking.branch_id,
          booking_id: booking._id,
          table_ids: booking.table_ids,
        });
        console.log(`✅ VNPay Return: Booking ${bookingId} CONFIRMED`);
      } else {
        booking.status = 'CANCELLED_PAYMENT_FAILED';
        booking.payment_info.status = 'FAILED';
        booking.expires_at = undefined;
        await booking.save();

        await TableLockService.unlockTables(
          booking.branch_id.toString(),
          booking.table_ids.map(id => id.toString())
        );

        const io = require('../socket').getIO();
        io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
          action: 'CANCELLED_PAYMENT_FAILED',
          branch_id: booking.branch_id,
          booking_id: booking._id,
          table_ids: booking.table_ids,
        });

        console.log(`❌ VNPay Return: Booking ${bookingId} FAILED and tables released`);
      }
    }
  }

  // Redirect về FE với query params
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendUrl}/booking/payment-result?bookingId=${bookingId}&status=${result.responseCode === '00' ? 'success' : 'failed'}`;

  res.redirect(redirectUrl);
});
// ============================================================
// @desc   API Giả lập thanh toán thành công (Dành cho App)
// @route  POST /api/v1/payment/mock-payment
// @access Public
// ============================================================
const mockPayment = asyncHandler(async (req, res) => {
  const { booking_id, voucher_code } = req.body;
  const booking = await Booking.findById(booking_id);
  const PaymentService = require('../services/PaymentService');
  const TableLockService = require('../services/tableLockService');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (booking.status !== 'PENDING_PAYMENT' && booking.status !== 'HOLDING') {
    return res.status(400).json({ success: false, message: 'Booking already processed or not in pending payment state' });
  }

  if (booking.status === 'HOLDING') {
    const { 
      tableDeposit, preOrderTotal, preOrderDeposit, voucherDiscount, totalDeposit 
    } = await PaymentService.calculateDepositData(booking_id, voucher_code, true);

    booking.table_deposit_amount = tableDeposit;
    booking.pre_order_total_amount = preOrderTotal;
    booking.pre_order_deposit_amount = preOrderDeposit;
    booking.voucher_discount_amount = voucherDiscount;
    booking.total_deposit_paid = totalDeposit;
    booking.applied_voucher_code = voucher_code || null;
  }

  // === THANH TOÁN THÀNH CÔNG ===
  booking.status = 'CONFIRMED';
  if (!booking.payment_info) {
    booking.payment_info = {};
  }
  booking.payment_info.method = 'MOCK';
  booking.payment_info.status = 'PAID';
  booking.payment_info.transaction_id = `MOCK_TXN_${Date.now()}`;
  booking.payment_info.paid_at = new Date();
  booking.expires_at = undefined;

  await booking.save();

  await TableLockService.unlockTables(
    booking.branch_id.toString(),
    booking.table_ids.map(id => id.toString())
  );

  const io = require('../socket').getIO();
  io.to(`branch_${booking.branch_id}`).emit('table_status_changed', {
    action: 'CONFIRMED',
    branch_id: booking.branch_id,
    booking_id: booking._id,
    table_ids: booking.table_ids,
  });

  res.status(200).json({
    success: true,
    message: 'Thanh toán giả lập thành công!',
    data: booking
  });
});

module.exports = {
  calculateDeposit,
  createPayment,
  handleVNPayIPN,
  handleMoMoIPN,
  handleVNPayReturn,
  mockPayment
};
