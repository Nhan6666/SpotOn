const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// GET /api/v1/categories
router.get('/', getAllCategories);

// POST /api/v1/categories
router.post('/', protect, authorize('ADMIN', 'MANAGER'), createCategory);

// PUT /api/v1/categories/:id
router.put('/:id', protect, authorize('ADMIN', 'MANAGER'), updateCategory);

// DELETE /api/v1/categories/:id
router.delete('/:id', protect, authorize('ADMIN', 'MANAGER'), deleteCategory);

module.exports = router;
