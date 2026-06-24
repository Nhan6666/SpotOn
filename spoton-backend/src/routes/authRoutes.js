const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, verifyOtp, forgotPassword, resetPassword, verifyForgotPasswordOtp } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');


// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/v1/auth/google
router.post('/google', googleAuth);

// GET /api/v1/auth/me  (cần đăng nhập)
router.get('/me', protect, getMe);

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/v1/auth/verify-forgot-password-otp
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);

// POST /api/v1/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;
