// ============================================================
// UPLOAD CONTROLLER — Xử lý upload ảnh (Cloudinary)
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

// @desc   Upload ảnh đại diện (Cloudinary)
// @route  POST /api/v1/uploads/avatar
// @access Private
// Folder trên Cloudinary: SpotOn/user/{email}/avatar/
const uploadAvatarImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh để tải lên.',
      });
    }

    // Cloudinary trả URL trong req.file.path
    const imageUrl = req.file.path;

    res.status(201).json({
      success: true,
      message: 'Tải ảnh đại diện thành công.',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Lỗi uploadAvatarImage:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Upload ảnh bàn (Cloudinary)
// @route  POST /api/v1/uploads/table
// @access Private (ADMIN, MANAGER)
const uploadTableImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh để tải lên.',
      });
    }

    const imageUrl = req.file.path;

    res.status(201).json({
      success: true,
      message: 'Tải ảnh bàn thành công.',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Lỗi uploadTableImage:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = { uploadMenuImage, uploadAvatarImage, uploadTableImage };
