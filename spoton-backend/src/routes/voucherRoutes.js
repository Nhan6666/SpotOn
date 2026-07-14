const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Route dành riêng cho phía Khách hàng (Public)
router.get('/public/global', voucherController.getPublicGlobalVouchers);
router.get('/public/branch/:branchId', voucherController.getPublicVouchersByBranch);

// API Validate mã voucher (Dùng khi khách chọn/nhập mã lúc đặt bàn)
router.post('/validate', voucherController.validateVoucher);

// Các route yêu cầu user đã đăng nhập (Ví dụ: CUSTOMER lưu voucher vào ví)
router.get('/my-wallet', protect, voucherController.getMyWallet);
router.post('/claim', protect, voucherController.claimVoucher);

// Chỉ ADMIN và MANAGER mới có quyền quản lý Voucher CRUD
router.use(protect);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/wallet/:customerId', voucherController.getWalletByCustomerId);

router.route('/')
  .get(voucherController.getAllVouchers)
  .post(voucherController.createVoucher);

router.route('/:id')
  .get(voucherController.getVoucherById)
  .put(voucherController.updateVoucher)
  .delete(voucherController.deleteVoucher);

module.exports = router;
