const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { uploadMenuImage, uploadAvatarImage, uploadTableImage, uploadBranchImages } = require('../controllers/uploadController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ============================================================
// CLOUDINARY CONFIGURATION
// ============================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================================
// MENU IMAGE STORAGE (Cloudinary)
// ============================================================
const menuStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: async (req, file) => {
      const formatStr = (str) => {
        if (!str) return 'unknown';
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      };
      let cat = formatStr(req.body.category || 'other');
      let name = formatStr(req.body.itemName || 'menu_item');
      let branchName = req.body.branchName ? formatStr(req.body.branchName) : null;
      
      if (branchName) {
        return `SpotOn/${branchName}/menu/${cat}/${name}`;
      } else {
        return `SpotOn/menu/${cat}/${name}`;
      }
    },
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
    public_id: (req, file) => {
      return `img_${Date.now()}`;
    },
  },
});

const uploadMenu = multer({
  storage: menuStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});

// ============================================================
// AVATAR IMAGE STORAGE (Cloudinary)
// Folder: SpotOn/user/{email}/avatar/
// ============================================================
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: async (req, file) => {
      // Lấy email từ user đã xác thực (middleware protect đã gắn req.user)
      const email = req.user?.email || 'unknown';
      // Chuẩn hóa email thành tên thư mục an toàn (thay @ và . thành -)
      const safeEmail = email.toLowerCase().replace(/[@.]/g, '-');
      return `SpotOn/user/${safeEmail}/avatar`;
    },
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
    public_id: (req, file) => {
      return `avatar_${Date.now()}`;
    },
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
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
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});

// ============================================================
// TABLE IMAGE STORAGE (Cloudinary)
// ============================================================
const tableStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'SpotOn/tables',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
    public_id: (req, file) => `table_${Date.now()}`,
  },
});

const uploadTable = multer({
  storage: tableStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});

// ============================================================
// BRANCH IMAGE STORAGE (Cloudinary)
// ============================================================
const branchStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: async (req, file) => {
      const branchId = req.params.id || 'unknown';
      return `SpotOn/branches/${branchId}`;
    },
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
    public_id: (req, file) => `branch_img_${Date.now()}`,
  },
});

const uploadBranch = multer({
  storage: branchStorage,
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
  uploadMenu.single('image'),
  uploadMenuImage
);

// POST /api/v1/uploads/avatar — Upload ảnh đại diện (lưu Cloudinary)
router.post(
  '/avatar',
  protect,
  uploadAvatar.single('image'),
  uploadAvatarImage
);

// POST /api/v1/uploads/table — Upload ảnh bàn (lưu Cloudinary)
router.post(
  '/table',
  protect,
  authorize('ADMIN', 'MANAGER'),
  uploadTable.single('image'),
  uploadTableImage
);

// PUT /api/v1/uploads/branch/:id — Upload nhiều ảnh chi nhánh (lưu Cloudinary)
router.put(
  '/branch/:id',
  protect,
  authorize('ADMIN', 'MANAGER'),
  uploadBranch.array('images', 5), // Tối đa 5 ảnh
  uploadBranchImages
);

module.exports = router;
