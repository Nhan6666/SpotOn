const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, verifyOtp } = require('../controllers/authController');// const { protect } = require('../middlewares/authMiddleware'); // Uncomment khi implement middleware
const { protect } = require('../middlewares/authMiddleware');


// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/v1/auth/google
router.post('/google', googleAuth);

// GET /api/v1/auth/me  (cần đăng nhập)
// router.get('/me', protect, getMe);
router.get('/me', protect, getMe);

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', verifyOtp);

module.exports = router;
