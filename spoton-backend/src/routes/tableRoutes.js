const express = require('express');
const router = express.Router({ mergeParams: true }); // Bắt buộc để nhận branchId, zoneId

const {
  addTable,
  updateTable,
  deleteTable,
  bulkUpdateTablesLayout
} = require('../controllers/tableController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Các routes này sẽ nối tiếp `/api/v1/branches/:branchId/zones/:zoneId/tables`
router.route('/')
  .post(protect, authorize('ADMIN', 'MANAGER'), addTable);

router.put('/layout', protect, authorize('ADMIN', 'MANAGER'), bulkUpdateTablesLayout);

router.route('/:tableId')
  .put(protect, authorize('ADMIN', 'MANAGER'), updateTable)
  .delete(protect, authorize('ADMIN', 'MANAGER'), deleteTable);

module.exports = router;
