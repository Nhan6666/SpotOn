const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getAllAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} = require('../controllers/amenityController');

// Public route để hiển thị cho khách xem
router.get('/', getAllAmenities);

// Admin routes
router.post('/', protect, authorize('ADMIN'), createAmenity);
router.put('/:id', protect, authorize('ADMIN'), updateAmenity);
router.delete('/:id', protect, authorize('ADMIN'), deleteAmenity);

module.exports = router;
