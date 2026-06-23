// ============================================================
// UPLOAD CONTROLLER — Xử lý upload ảnh cho Menu Items
// ============================================================

// @desc   Upload ảnh món ăn
// @route  POST /api/v1/uploads/menu
// @access Private (ADMIN, MANAGER)
const uploadMenuImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh để tải lên.',
      });
    }

    // Với Cloudinary, URL được trả về trong req.file.path
    const imageUrl = req.file.path;

    res.status(201).json({
      success: true,
      message: 'Tải ảnh lên thành công.',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Lỗi uploadMenuImage:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = { uploadMenuImage };
