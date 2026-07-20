const Review = require('../models/Review');
const Branch = require('../models/Branch');

// =============================================
// CONTROLLER: Đánh giá chi nhánh
// =============================================

/**
 * @desc    Tạo đánh giá mới cho chi nhánh
 * @route   POST /api/v1/reviews
 * @access  Private (CUSTOMER / Logged in users)
 */
exports.createReview = async (req, res) => {
  try {
    const { branch_id, rating, comment } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!branch_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp branch_id.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Số sao đánh giá phải từ 1 đến 5.' });
    }

    // Kiểm tra chi nhánh tồn tại
    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    // Tạo review mới
    const review = await Review.create({
      branch_id,
      user_id: userId,
      rating,
      comment: comment || '',
    });

    // Populate thông tin user vừa đánh giá để trả về đồng bộ
    const populatedReview = await Review.findById(review._id).populate({
      path: 'user_id',
      select: 'full_name avatar',
    });

    return res.status(201).json({
      success: true,
      message: 'Gửi đánh giá thành công! Cảm ơn ý kiến của bạn.',
      data: populatedReview,
    });
  } catch (error) {
    console.error('Lỗi khi tạo đánh giá:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server khi tạo đánh giá.' });
  }
};

/**
 * @desc    Lấy danh sách đánh giá của chi nhánh
 * @route   GET /api/v1/reviews/branch/:branchId
 * @access  Public
 */
exports.getBranchReviews = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Tìm các review không bị xoá soft-delete
    const reviews = await Review.find({
      branch_id: branchId,
      is_deleted: { $ne: true },
    })
      .populate({
        path: 'user_id',
        select: 'full_name avatar',
      })
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('Lỗi khi lấy đánh giá chi nhánh:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy đánh giá.' });
  }
};

/**
 * @desc    Admin lấy toàn bộ danh sách đánh giá
 * @route   GET /api/v1/reviews/admin
 * @access  Private (ADMIN)
 */
exports.getAllReviewsForAdmin = async (req, res) => {
  try {
    // Lấy toàn bộ reviews, populate cả branch và user
    const reviews = await Review.find()
      .populate({
        path: 'user_id',
        select: 'full_name email phone avatar',
      })
      .populate({
        path: 'branch_id',
        select: 'name address',
      })
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('Lỗi khi Admin lấy đánh giá:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy tất cả đánh giá.' });
  }
};

/**
 * @desc    Admin soft-delete đánh giá
 * @route   DELETE /api/v1/reviews/admin/:reviewId
 * @access  Private (ADMIN)
 */
exports.deleteReviewForAdmin = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const adminId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
    }

    if (review.is_deleted) {
      return res.status(400).json({ success: false, message: 'Đánh giá này đã được xoá từ trước.' });
    }

    // Soft delete
    review.is_deleted = true;
    review.deleted_at = new Date();
    review.deleted_by = adminId;
    await review.save();

    return res.status(200).json({
      success: true,
      message: 'Đã xoá đánh giá thành công (Soft Delete).',
      data: review,
    });
  } catch (error) {
    console.error('Lỗi khi Admin xoá đánh giá:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server khi xoá đánh giá.' });
  }
};
