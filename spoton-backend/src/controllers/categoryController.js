const Menu = require('../models/Menu');

// ============================================================
// @desc   Lấy tất cả danh mục (có thể filter theo branch_id)
// @route  GET /api/v1/categories?branch_id=xxx
// @access Public
// ============================================================
const getAllCategories = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const filter = branch_id ? { branch_id } : {};

    const categories = await Menu.find(filter);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục thành công.',
      data: categories,
    });
  } catch (error) {
    console.error('Lỗi getAllCategories:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Tạo danh mục mới
// @route  POST /api/v1/categories
// @access Private (ADMIN, MANAGER)
// ============================================================
const createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };

    // BẢO MẬT: Nếu là Manager, ép cứng branch_id vào data để họ không tạo danh mục cho chi nhánh khác
    if (req.user.role === 'MANAGER') {
      categoryData.branch_id = req.user.branch_id;
    }

    const newCategory = await Menu.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công.',
      data: newCategory,
    });
  } catch (error) {
    console.error('Lỗi createCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Cập nhật tên danh mục
// @route  PUT /api/v1/categories/:id
// @access Private (ADMIN, MANAGER)
// ============================================================
const updateCategory = async (req, res) => {
  try {
    const { category_name } = req.body;
    const category = await Menu.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
    }

    if (req.user && req.user.role === 'MANAGER' && String(category.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa danh mục của chi nhánh khác.' });
    }

    category.category_name = category_name || category.category_name;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công.',
      data: category,
    });
  } catch (error) {
    console.error('Lỗi updateCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Xóa danh mục
// @route  DELETE /api/v1/categories/:id
// @access Private (ADMIN, MANAGER)
// ============================================================
const deleteCategory = async (req, res) => {
  try {
    const category = await Menu.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
    }

    if (req.user && req.user.role === 'MANAGER' && String(category.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa danh mục của chi nhánh khác.' });
    }

    if (category.items && category.items.length > 0) {
      return res.status(400).json({ success: false, message: 'Không thể xóa danh mục đang chứa món ăn.' });
    }

    await Menu.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công.',
    });
  } catch (error) {
    console.error('Lỗi deleteCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
