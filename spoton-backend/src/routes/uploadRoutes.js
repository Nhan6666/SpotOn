const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { uploadMenuImage, uploadAvatarImage } = require('../controllers/uploadController');
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

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `avatar_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh!'), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
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

// POST /api/v1/uploads/avatar — Upload ảnh đại diện
router.post(
  '/avatar',
  protect,
  uploadAvatar.single('image'),
  uploadAvatarImage
);

module.exports = router;
