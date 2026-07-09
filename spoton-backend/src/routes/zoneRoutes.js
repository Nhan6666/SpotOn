const express = require('express');
const router = express.Router({ mergeParams: true }); // Bắt buộc để nhận branchId từ branchRoutes

const {
  getZonesByBranch,
  addZone,
  updateZone,
  deleteZone
} = require('../controllers/zoneController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Các routes này sẽ nối tiếp `/api/v1/branches/:branchId/zones`
router.route('/')
  .get(protect, authorize('ADMIN', 'MANAGER'), getZonesByBranch)
  .post(protect, authorize('ADMIN', 'MANAGER'), addZone);

router.route('/:zoneId')
  .put(protect, authorize('ADMIN', 'MANAGER'), updateZone)
  .delete(protect, authorize('ADMIN', 'MANAGER'), deleteZone);

// Mount tableRoutes vào trong zoneRoutes
const tableRoutes = require('./tableRoutes');
router.use('/:zoneId/tables', tableRoutes);

// Kế thừa apply template (cần zoneId)
const { applyTemplate } = require('../controllers/tableController');
router.post('/:zoneId/apply-template', protect, authorize('ADMIN', 'MANAGER'), applyTemplate);

module.exports = router;
