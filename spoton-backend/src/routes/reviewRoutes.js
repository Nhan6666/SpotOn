const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Route công khai: Lấy danh sách đánh giá của chi nhánh
router.get('/branch/:branchId', reviewController.getBranchReviews);

// Route cần đăng nhập: Khách hàng viết đánh giá
router.post('/', protect, reviewController.createReview);

// Route Admin: Xem tất cả đánh giá
router.get('/admin', protect, authorize('ADMIN'), reviewController.getAllReviewsForAdmin);

// Route Admin: Xoá đánh giá (soft-delete)
router.delete('/admin/:reviewId', protect, authorize('ADMIN'), reviewController.deleteReviewForAdmin);

module.exports = router;
