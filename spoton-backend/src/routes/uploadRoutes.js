const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { uploadMenuImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ============================================================
// CLOUDINARY CONFIGURATION
// ============================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: async (req, file) => {
      const formatStr = (str) => {
        if (!str) return 'unknown';
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      };
      let cat = formatStr(req.body.category || 'other');
      let name = formatStr(req.body.itemName || 'menu_item');
      return `SpotOn/menu/${cat}/${name}`;
    },
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
    public_id: (req, file) => {
      return `img_${Date.now()}`;
    },
  },
});

const upload = multer({
  storage,
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
