const Menu = require('../models/Menu');

// ============================================================
// HELPER: Generate SKU for Local Items
// ============================================================
const generateLocalSKU = (categoryName, branchId, existingItems) => {
  const prefix = categoryName
    .replace(/[^a-zA-Z\s]/g, '')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3) || 'LOC';
  const branchPrefix = String(branchId).substring(0, 4).toUpperCase();
  const count = (existingItems || 0) + 1;
  return `L-${branchPrefix}-${prefix}-${String(count).padStart(3, '0')}`;
};

// ============================================================
// @desc   Lấy Menu của Chi nhánh (Kết hợp Master + Local)
// @route  GET /api/v1/manager/menus
// @access Private (MANAGER)
// ============================================================
const getManagerMenu = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) {
      return res.status(403).json({ success: false, message: 'Tài khoản chưa được gán chi nhánh.' });
    }

    // 1. Lấy Local Menu
    const localMenus = await Menu.find({ branch_id: branchId }).lean();
    
    // 2. Lấy toàn bộ Master Menu
    const masterMenus = await Menu.find({ branch_id: null }).lean();

    // Dùng Map để nhóm theo category_name
    const categoryMap = new Map();

    // Map Master Menus
    masterMenus.forEach(menu => {
      const items = menu.items.map(item => {
        const override = item.branch_overrides?.find(o => String(o.branch_id) === String(branchId));
        return {
          ...item,
          is_master: true,
          // Mặc định là hết hàng và số lượng 0 nếu quản lý chưa từng cấu hình
          is_available: override && override.is_available !== undefined ? override.is_available : false,
          quantity: override && override.quantity !== undefined ? override.quantity : 0, 
        };
      });

      if (!categoryMap.has(menu.category_name)) {
        categoryMap.set(menu.category_name, {
          category_name: menu.category_name,
          master_category_id: menu._id,
          items: []
        });
      }
      categoryMap.get(menu.category_name).items.push(...items);
    });

    // Map Local Menus
    localMenus.forEach(menu => {
      const items = menu.items.map(item => ({
        ...item,
        is_master: false,
        quantity: item.quantity !== undefined && item.quantity >= 0 ? item.quantity : 0,
      }));

      if (!categoryMap.has(menu.category_name)) {
        categoryMap.set(menu.category_name, {
          category_name: menu.category_name,
          local_category_id: menu._id,
          items: []
        });
      }
      categoryMap.get(menu.category_name).items.push(...items);
    });

    // Chuyển Map thành Array
    const combinedCategories = Array.from(categoryMap.values());

    res.status(200).json({
      success: true,
      message: 'Lấy Menu chi nhánh thành công.',
      data: combinedCategories,
    });
  } catch (error) {
    console.error('Lỗi getManagerMenu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Cập nhật Override cho Master Item (is_available, quantity)
// @route  PATCH /api/v1/manager/menus/master/:itemId/override
// @access Private (MANAGER)
// ============================================================
const updateMasterItemOverride = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) {
      return res.status(403).json({ success: false, message: 'Tài khoản chưa được gán chi nhánh.' });
    }

    const { is_available, quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Bắt buộc phải set số lượng (tồn kho >= 0).' });
    }
    
    // Tìm Master Menu chứa itemId này
    const menu = await Menu.findOne({ branch_id: null, 'items._id': req.params.itemId });
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn Master.' });
    }

    const item = menu.items.id(req.params.itemId);

    // Find override
    let override = item.branch_overrides.find(o => String(o.branch_id) === String(branchId));
    if (!override) {
      override = {
        branch_id: branchId,
        is_available: is_available !== undefined ? is_available : false,
        quantity: quantity
      };
      item.branch_overrides.push(override);
    } else {
      if (is_available !== undefined) override.is_available = is_available;
      if (quantity !== undefined) override.quantity = quantity;
    }

    await menu.save();

    // Phát sự kiện Real-time để đồng bộ Menu trên iPad và KDS
    const io = require('../socket').getIO();
    io.to(`branch_${branchId}`).emit('MENU_UPDATED', { action: 'UPDATE_MASTER_OVERRIDE' });

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái và tồn kho món Master thành công.',
      data: override
    });
  } catch (error) {
    console.error('Lỗi updateMasterItemOverride:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Thêm món ăn Local của riêng chi nhánh
// @route  POST /api/v1/manager/menus/local
// @access Private (MANAGER)
// ============================================================
const addLocalItem = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) {
      return res.status(403).json({ success: false, message: 'Tài khoản chưa được gán chi nhánh.' });
    }

    const {
      category_name, name, description, dietary_tags, base_price,
      is_available, quantity, image_url
    } = req.body;

    if (!category_name) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn Danh mục (Category).' });
    }

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Bắt buộc phải set số lượng (tồn kho >= 0).' });
    }

    // Tự động tìm hoặc tạo Local Category cho chi nhánh này
    let localMenu = await Menu.findOne({ branch_id: branchId, category_name });
    if (!localMenu) {
      localMenu = new Menu({
        branch_id: branchId,
        category_name: category_name,
        items: []
      });
    }

    const sku = req.body.sku || generateLocalSKU(category_name, branchId, localMenu.items.length);

    const newItem = {
      name,
      sku,
      description,
      dietary_tags: dietary_tags || [],
      base_price,
      price: base_price,
      min_price: base_price,
      max_price: base_price,
      is_core_item: false,
      image_url: image_url || '',
      status: 'ACTIVE',
      is_available: is_available !== undefined ? is_available : true,
      quantity: quantity,
      branches: [branchId], // Gắn nhãn chỉ áp dụng cho chi nhánh này (optional for logic, good for clarity)
    };

    localMenu.items.push(newItem);
    await localMenu.save();

    const addedItem = localMenu.items[localMenu.items.length - 1];

    // Phát sự kiện Real-time để đồng bộ Menu trên iPad và KDS
    const io = require('../socket').getIO();
    io.to(`branch_${branchId}`).emit('MENU_UPDATED', { action: 'ADD_LOCAL_ITEM' });

    res.status(201).json({
      success: true,
      message: 'Thêm món ăn Local thành công.',
      data: addedItem,
    });
  } catch (error) {
    console.error('Lỗi addLocalItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Sửa món ăn Local của riêng chi nhánh
// @route  PUT /api/v1/manager/menus/local/:itemId
// @access Private (MANAGER)
// ============================================================
const updateLocalItem = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    
    // Tìm Local Menu chứa itemId này
    const menu = await Menu.findOne({ branch_id: branchId, 'items._id': req.params.itemId });
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn Local của bạn.' });
    }

    const item = menu.items.id(req.params.itemId);
    
    const allowedFields = [
      'name', 'sku', 'description', 'dietary_tags', 'base_price',
      'image_url', 'is_available', 'quantity'
    ];

    allowedFields.forEach(key => {
      if (req.body[key] !== undefined) {
        item[key] = req.body[key];
      }
    });

    if (item.quantity < 0) {
       return res.status(400).json({ success: false, message: 'Số lượng tồn kho không hợp lệ.' });
    }

    await menu.save();

    // Phát sự kiện Real-time để đồng bộ Menu trên iPad và KDS
    const io = require('../socket').getIO();
    io.to(`branch_${branchId}`).emit('MENU_UPDATED', { action: 'UPDATE_LOCAL_ITEM' });

    res.status(200).json({
      success: true,
      message: 'Cập nhật món ăn Local thành công.',
      data: item,
    });
  } catch (error) {
    console.error('Lỗi updateLocalItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Xóa món ăn Local của riêng chi nhánh
// @route  DELETE /api/v1/manager/menus/local/:itemId
// @access Private (MANAGER)
// ============================================================
const deleteLocalItem = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    
    // Tìm Local Menu chứa itemId này
    const menu = await Menu.findOne({ branch_id: branchId, 'items._id': req.params.itemId });
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn Local của bạn.' });
    }

    menu.items.pull({ _id: req.params.itemId });
    await menu.save();

    // Phát sự kiện Real-time để đồng bộ Menu trên iPad và KDS
    const io = require('../socket').getIO();
    io.to(`branch_${branchId}`).emit('MENU_UPDATED', { action: 'DELETE_LOCAL_ITEM' });

    res.status(200).json({
      success: true,
      message: 'Xóa món ăn Local thành công.',
    });
  } catch (error) {
    console.error('Lỗi deleteLocalItem:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = {
  getManagerMenu,
  updateMasterItemOverride,
  addLocalItem,
  updateLocalItem,
  deleteLocalItem
};
