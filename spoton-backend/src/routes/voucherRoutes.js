const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Route dành riêng cho phía Khách hàng (Public)
router.get('/public/global', voucherController.getPublicGlobalVouchers);
router.get('/public/branch/:branchId', voucherController.getPublicVouchersByBranch);

// Chỉ ADMIN và MANAGER mới có quyền quản lý Voucher
router.use(protect);
router.use(authorize('ADMIN', 'MANAGER'));

router.route('/')
  .get(voucherController.getAllVouchers)
  .post(voucherController.createVoucher);

router.route('/:id')
  .get(voucherController.getVoucherById)
  .put(voucherController.updateVoucher)
  .delete(voucherController.deleteVoucher);

module.exports = router;
