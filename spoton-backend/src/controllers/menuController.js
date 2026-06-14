// ============================================================
// MENU CONTROLLER
// Xử lý: CRUD menu, quản lý items trong từng category
// ============================================================
const Menu = require('../models/Menu');

// @desc   Lấy tất cả danh mục menu (có thể filter theo branch_id)
// @route  GET /api/v1/menus?branch_id=xxx
// @access Public
const getAllMenus = async (req, res) => {
  try {
    const { branch_id } = req.query;
    
    // Nếu có truyền branch_id thì lọc, không thì lấy toàn hệ thống
    const filter = branch_id ? { branch_id } : {};
    
    const menus = await Menu.find(filter);

    res.status(200).json({ 
      success: true, 
      message: 'Lấy danh sách thực đơn thành công.',
      data: menus 
    });
  } catch (error) {
    console.error('Lỗi getAllMenus:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Tạo danh mục menu mới
// @route  POST /api/v1/menus
// @access Private (ADMIN, MANAGER)
const createMenu = async (req, res) => {
  try {
    const menuData = { ...req.body };

    // BẢO MẬT: Nếu là Manager, ép cứng branch_id vào data để họ không tạo menu cho chi nhánh khác
    if (req.user.role === 'MANAGER') {
      menuData.branch_id = req.user.branch_id;
    }

    const newMenu = await Menu.create(menuData);

    res.status(201).json({ 
      success: true, 
      message: 'Tạo danh mục thực đơn thành công.',
      data: newMenu 
    });
  } catch (error) {
    console.error('Lỗi createMenu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Thêm món ăn vào danh mục
// @route  POST /api/v1/menus/:menuId/items
// @access Private (ADMIN, MANAGER)
const addMenuItem = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục thực đơn.' });
    }

    // BẢO MẬT: Manager chỉ được thêm món vào thực đơn của chi nhánh mình
    if (req.user.role === 'MANAGER' && String(menu.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa thực đơn của chi nhánh khác.' });
    }

    menu.items.push(req.body);
    await menu.save();

    res.status(201).json({ 
      success: true, 
      message: 'Thêm món ăn mới thành công.',
      data: menu 
    });
  } catch (error) {
    console.error('Lỗi addMenuItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật món ăn trong danh mục
// @route  PUT /api/v1/menus/:menuId/items/:itemId
// @access Private (ADMIN, MANAGER)
const updateMenuItem = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục thực đơn.' });
    }

    // BẢO MẬT: Chặn Manager sửa chéo
    if (req.user.role === 'MANAGER' && String(menu.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa thực đơn của chi nhánh khác.' });
    }

    const item = menu.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn.' });
    }

    // Cập nhật từng trường dữ liệu được gửi lên
    Object.keys(req.body).forEach(key => {
      item[key] = req.body[key];
    });

    await menu.save();

    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật món ăn thành công.',
      data: menu 
    });
  } catch (error) {
    console.error('Lỗi updateMenuItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Xóa món ăn khỏi danh mục
// @route  DELETE /api/v1/menus/:menuId/items/:itemId
// @access Private (ADMIN, MANAGER)
const deleteMenuItem = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục thực đơn.' });
    }

    // BẢO MẬT: Chặn Manager xóa chéo
    if (req.user.role === 'MANAGER' && String(menu.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa thực đơn của chi nhánh khác.' });
    }

    // Mongoose Subdocument: Dùng pull để xóa item khỏi array
    menu.items.pull({ _id: req.params.itemId });
    await menu.save();

    res.status(200).json({ 
      success: true, 
      message: 'Xóa món ăn thành công.',
      data: menu 
    });
  } catch (error) {
    console.error('Lỗi deleteMenuItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = { getAllMenus, createMenu, addMenuItem, updateMenuItem, deleteMenuItem };