const express = require('express');
const router = express.Router();
const mapTemplateController = require('../controllers/mapTemplateController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
// Both ADMIN and MANAGER can read templates
router.get('/', authorize('ADMIN', 'MANAGER'), mapTemplateController.getAllTemplates);
router.get('/:id', authorize('ADMIN', 'MANAGER'), mapTemplateController.getTemplateById);
router.get('/:id/zones', authorize('ADMIN', 'MANAGER'), mapTemplateController.getZonesByTemplate);

// Only ADMIN can modify templates
router.use(authorize('ADMIN'));

router.post('/', mapTemplateController.createTemplate);
router.put('/:id', mapTemplateController.updateTemplate);
router.delete('/:id', mapTemplateController.deleteTemplate);

router.post('/:id/zones', mapTemplateController.addZone);
router.put('/:id/zones/:zoneId', mapTemplateController.updateZone);
router.delete('/:id/zones/:zoneId', mapTemplateController.deleteZone);

router.post('/:id/zones/:zoneId/tables', mapTemplateController.addTable);
router.put('/:id/zones/:zoneId/tables/layout', mapTemplateController.bulkUpdateTablesLayout);
router.put('/:id/zones/:zoneId/tables/:tableId', mapTemplateController.updateTable);
router.delete('/:id/zones/:zoneId/tables/:tableId', mapTemplateController.deleteTable);

module.exports = router;
