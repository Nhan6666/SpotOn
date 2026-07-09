const Menu = require('../models/Menu');
const MenuService = require('../services/MenuService');
const mongoose = require('mongoose');

// ============================================================
// @desc   Lấy tất cả Master Menu (branch_id = null)
// @route  GET /api/v1/menus/master
// @access Private (ADMIN)
// ============================================================
const getMasterMenus = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 8));
    const categoryFilter = req.query.category || '';
    const searchQuery = (req.query.search || '').trim().toLowerCase();

    const data = await MenuService.getPaginatedMasterMenus(page, limit, categoryFilter, searchQuery);

    res.status(200).json({
      success: true,
      message: 'Lấy Master Menu thành công.',
      data
    });
  } catch (error) {
    console.error('Lỗi getMasterMenus:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Thêm món ăn vào Master Menu
// @route  POST /api/v1/menus/:menuId/items
// @access Private (ADMIN)
// ============================================================
const addMenuItem = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục thực đơn.' });
    }

    if (req.user.role === 'MANAGER' && String(menu.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa thực đơn của chi nhánh khác.' });
    }

    const {
      name, description, dietary_tags, base_price,
      min_price, max_price, is_core_item, image_url,
      status, branches,
    } = req.body;

    const minP = min_price !== undefined ? min_price : 0;
    const maxP = max_price !== undefined ? max_price : base_price;
    
    const priceErrors = MenuService.validatePriceRange(base_price, minP, maxP);
    if (priceErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Lỗi xác thực khoảng giá (BR-01).',
        errors: priceErrors,
      });
    }

    const sku = req.body.sku || await MenuService.generateSKU(menu.category_name);

    const validBranches = (branches || []).filter(id => mongoose.Types.ObjectId.isValid(id));

    const newItem = {
      name,
      sku,
      description,
      dietary_tags: dietary_tags || [],
      base_price,
      price: base_price,
      min_price: minP,
      max_price: maxP,
      is_core_item: is_core_item || false,
      image_url: image_url || '',
      status: status || 'ACTIVE',
      branches: validBranches,
    };

    menu.items.push(newItem);
    await menu.save();

    const addedItem = menu.items[menu.items.length - 1];
    res.status(201).json({
      success: true,
      message: 'Thêm món ăn mới vào Master Menu thành công.',
      data: addedItem,
    });
  } catch (error) {
    console.error('Lỗi addMenuItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Cập nhật món ăn trong Master Menu
// @route  PUT /api/v1/menus/:menuId/items/:itemId
// @access Private (ADMIN, MANAGER)
// ============================================================
const updateMenuItem = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục thực đơn.' });
    }

    if (req.user.role === 'MANAGER' && String(menu.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa thực đơn của chi nhánh khác.' });
    }

    const item = menu.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn.' });
    }

    const newBase = req.body.base_price !== undefined ? req.body.base_price : item.base_price;
    const newMin = req.body.min_price !== undefined ? req.body.min_price : item.min_price;
    const newMax = req.body.max_price !== undefined ? req.body.max_price : item.max_price;

    const priceErrors = MenuService.validatePriceRange(newBase, newMin, newMax);
    if (priceErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Lỗi xác thực khoảng giá (BR-01).',
        errors: priceErrors,
      });
    }

    const warnings = [];
    const isRangeNarrowed =
      (req.body.min_price !== undefined && req.body.min_price > item.min_price) ||
      (req.body.max_price !== undefined && req.body.max_price < item.max_price);

    if (isRangeNarrowed && menu.branch_id === null) {
      const branchMenus = await Menu.find({
        branch_id: { $ne: null },
        'items.name': item.name,
      }).populate('branch_id', 'name');

      const affectedBranches = [];
      branchMenus.forEach(bm => {
        bm.items.forEach(bi => {
          if (bi.name === item.name) {
            const branchPrice = bi.base_price;
            if (branchPrice < newMin || branchPrice > newMax) {
              affectedBranches.push({
                branch_id: bm.branch_id?._id,
                branch_name: bm.branch_id?.name || 'Unknown',
                current_price: branchPrice,
                violation: branchPrice < newMin ? 'BELOW_MIN' : 'ABOVE_MAX',
              });
            }
          }
        });
      });

      if (affectedBranches.length > 0) {
        warnings.push({
          code: 'EX-7.3.2',
          message: `Có ${affectedBranches.length} chi nhánh đang sử dụng mức giá ngoài khoảng cho phép mới.`,
          affected_branches: affectedBranches,
        });
      }
    }

    const allowedFields = [
      'name', 'sku', 'description', 'dietary_tags', 'base_price',
      'min_price', 'max_price', 'is_core_item', 'image_url',
      'status', 'branches', 'is_available',
    ];

    allowedFields.forEach(key => {
      if (req.body[key] !== undefined) {
        item[key] = req.body[key];
      }
    });

    await menu.save();

    const response = {
      success: true,
      message: 'Cập nhật món ăn thành công.',
      data: item,
    };

    if (warnings.length > 0) {
      response.warnings = warnings;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi updateMenuItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Xóa món ăn khỏi danh mục
// @route  DELETE /api/v1/menus/:menuId/items/:itemId
// @access Private (ADMIN, MANAGER)
// ============================================================
const deleteMenuItem = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục thực đơn.' });
    }

    if (req.user.role === 'MANAGER' && String(menu.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa thực đơn của chi nhánh khác.' });
    }

    const item = menu.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn.' });
    }

    if (req.user.role === 'MANAGER' && item.is_core_item) {
      return res.status(403).json({
        success: false,
        message: 'Món ăn cốt lõi (Core Item) không thể bị xóa bởi Manager. Bạn chỉ có thể ẩn món này.',
      });
    }

    menu.items.pull({ _id: req.params.itemId });
    await menu.save();

    res.status(200).json({
      success: true,
      message: 'Xóa món ăn thành công.',
      data: menu,
    });
  } catch (error) {
    console.error('Lỗi deleteMenuItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Toggle Core Item Lock
// @route  PATCH /api/v1/menus/:menuId/items/:itemId/core-lock
// @access Private (ADMIN only)
// ============================================================
const toggleCoreItem = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục thực đơn.' });
    }

    const item = menu.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn.' });
    }

    item.is_core_item = !item.is_core_item;
    await menu.save();

    res.status(200).json({
      success: true,
      message: item.is_core_item
        ? 'Đã khóa món ăn thành Core Item. Manager không thể xóa.'
        : 'Đã mở khóa Core Item. Manager có thể xóa.',
      data: { _id: item._id, is_core_item: item.is_core_item },
    });
  } catch (error) {
    console.error('Lỗi toggleCoreItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Toggle item visibility (Hide/Show)
// @route  PATCH /api/v1/menus/:menuId/items/:itemId/toggle-visibility
// @access Private (ADMIN, MANAGER)
// ============================================================
const toggleItemVisibility = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục thực đơn.' });
    }

    if (req.user.role === 'MANAGER' && String(menu.branch_id) !== String(req.user.branch_id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa thực đơn của chi nhánh khác.' });
    }

    const item = menu.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn.' });
    }

    item.is_available = !item.is_available;
    await menu.save();

    res.status(200).json({
      success: true,
      message: item.is_available ? 'Đã hiện món ăn.' : 'Đã ẩn món ăn.',
      data: { _id: item._id, is_available: item.is_available },
    });
  } catch (error) {
    console.error('Lỗi toggleItemVisibility:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = {
  getMasterMenus,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleCoreItem,
  toggleItemVisibility,
};
