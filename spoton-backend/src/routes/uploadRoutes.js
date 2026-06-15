const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadMenuImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ============================================================
// MULTER CONFIGURATION
// ============================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'menu');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: menu_{timestamp}_{random}.{ext}
    const ext = path.extname(file.originalname);
    const uniqueName = `menu_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (JPEG, PNG, WebP, GIF).'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});

// ============================================================
// ROUTES
// ============================================================

// POST /api/v1/uploads/menu — Upload ảnh món ăn
router.post(
  '/menu',
  protect,
  authorize('ADMIN', 'MANAGER'),
  upload.single('image'),
  uploadMenuImage
);

module.exports = router;
