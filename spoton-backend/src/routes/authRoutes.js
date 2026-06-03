const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe } = require('../controllers/authController');
// const { protect } = require('../middlewares/authMiddleware'); // Uncomment khi implement middleware

// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/v1/auth/google
router.post('/google', googleAuth);

// GET /api/v1/auth/me  (cần đăng nhập)
// router.get('/me', protect, getMe);
router.get('/me', getMe);

module.exports = router;
