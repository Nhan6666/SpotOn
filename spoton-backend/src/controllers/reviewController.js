const Review = require('../models/Review');
const Branch = require('../models/Branch');
const Booking = require('../models/Booking');

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
    const { booking_id, branch_id, rating, comment } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã đơn đặt bàn (booking_id).' });
    }
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

    // Kiểm tra xem khách hàng có đơn COMPLETED nào chưa đánh giá không
    const validBooking = await Booking.findOne({
      _id: booking_id,
      customer_id: userId,
      branch_id: branch_id,
      status: 'COMPLETED'
    });

    if (!validBooking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt bàn hợp lệ hoặc đơn chưa hoàn tất.' });
    }

    if (validBooking.has_reviewed) {
      return res.status(400).json({ success: false, message: 'Bạn đã gửi đánh giá cho đơn đặt bàn này rồi (BR-19-02).' });
    }

    // Tính toán SLA Deadline cho đánh giá 1-2 sao (2 tiếng)
    let sla_deadline = null;
    if (rating <= 2) {
      sla_deadline = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }

    // Tạo review mới (Bao gồm booking_id)
    const review = await Review.create({
      branch_id,
      booking_id,
      user_id: userId,
      rating,
      comment: comment || '',
      sla_deadline
    });

    // Đánh dấu đơn hàng đã được đánh giá
    validBooking.has_reviewed = true;
    await validBooking.save();

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

/**
 * @desc    Manager xem danh sách đánh giá của chi nhánh mình
 * @route   GET /api/v1/reviews/manager
 * @access  Private (MANAGER)
 */
exports.getManagerReviews = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) return res.status(403).json({ success: false, message: 'Bạn chưa được phân bổ vào chi nhánh nào.' });

    const reviews = await Review.find({ branch_id: branchId, is_deleted: { $ne: true } })
      .populate('user_id', 'full_name email phone avatar')
      .sort({ created_at: -1 });

    return res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error('Lỗi khi Manager lấy đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @desc    Manager trả lời đánh giá
 * @route   PUT /api/v1/reviews/:id/reply
 * @access  Private (MANAGER)
 */
exports.replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const managerId = req.user._id;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống.' });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });

    // Ensure manager can only reply to their branch's reviews
    if (String(review.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền trả lời đánh giá của chi nhánh khác.' });
    }

    review.reply = {
      text: text.trim(),
      replied_by: managerId,
      replied_at: new Date()
    };
    review.status = 'REPLIED';
    await review.save();

    // TODO: Write to AuditLogs here for BR-3 (if AuditLog model exists)

    return res.status(200).json({ success: true, message: 'Đã gửi phản hồi thành công.', data: review });
  } catch (error) {
    console.error('Lỗi khi trả lời đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @desc    Manager báo cáo đánh giá xấu/độc hại lên Admin
 * @route   PATCH /api/v1/reviews/:id/report
 * @access  Private (MANAGER)
 */
exports.reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });

    if (String(review.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác trên đánh giá này.' });
    }

    review.status = 'FLAGGED';
    await review.save();

    return res.status(200).json({ success: true, message: 'Đã báo cáo đánh giá vi phạm lên Admin.', data: review });
  } catch (error) {
    console.error('Lỗi khi báo cáo đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};
