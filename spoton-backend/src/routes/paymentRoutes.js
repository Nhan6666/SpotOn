// ============================================================
// PAYMENT ROUTES — UC-C12: Thanh toán cọc VNPay/MoMo
// ============================================================
const express = require('express');
const router = express.Router();
const {
  calculateDeposit,
  createPayment,
  handleVNPayIPN,
  handleMoMoIPN,
  handleVNPayReturn,
  mockPayment
} = require('../controllers/paymentController');

// ============================================================
// PUBLIC ROUTES (Không cần đăng nhập — Booking đã xác thực qua bookingId)
// ============================================================

// POST /api/v1/payment/calculate-deposit → Tính tiền cọc (Bước 1: Checkout Review)
router.post('/calculate-deposit', calculateDeposit);

// POST /api/v1/payment/create-payment → Tạo URL thanh toán VNPay/MoMo (Bước 2)
router.post('/create-payment', createPayment);

// POST /api/v1/payment/mock-payment → API giả lập VNPay trả về thành công (Dành cho App)
router.post('/mock-payment', mockPayment);

// ============================================================
// WEBHOOK ROUTES (VNPay/MoMo gọi ngầm — Tuyệt đối KHÔNG đặt middleware auth)
// ============================================================

// GET /api/v1/payment/vnpay-ipn → VNPay IPN callback
router.get('/vnpay-ipn', handleVNPayIPN);

// GET /api/v1/payment/vnpay-return → VNPay redirect khách quay lại
router.get('/vnpay-return', handleVNPayReturn);

// POST /api/v1/payment/momo-ipn → MoMo IPN callback
router.post('/momo-ipn', handleMoMoIPN);

module.exports = router;
