// ============================================================
// MENU CONTROLLER — UC-7.3: Quản lý Thực đơn Gốc (Master Menu)
// Business Rules: BR-01, BR-02, BR-03
// Exceptions: EX-7.3.1, EX-7.3.2
// ============================================================
const Menu = require('../models/Menu');

// ============================================================
// HELPER: Validate BR-01 (Price Range Validation)
// Min Price <= Base Price <= Max Price
// ============================================================
const validatePriceRange = (base_price, min_price, max_price) => {
  const errors = [];
  if (min_price !== undefined && max_price !== undefined && min_price > max_price) {
    errors.push('Min Price phải nhỏ hơn hoặc bằng Max Price.');
  }
  if (min_price !== undefined && base_price < min_price) {
    errors.push('Base Price phải lớn hơn hoặc bằng Min Price.');
  }
  if (max_price !== undefined && base_price > max_price) {
    errors.push('Base Price phải nhỏ hơn hoặc bằng Max Price.');
  }
  return errors;
};

// ============================================================
// HELPER: Generate SKU
// Format: ITM-{CATEGORY_PREFIX}-{SEQUENCE}
// ============================================================
const generateSKU = (categoryName, existingItems) => {
  const prefix = categoryName
    .replace(/[^a-zA-Z\s]/g, '')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3) || 'GEN';
  const count = (existingItems || 0) + 1;
  return `ITM-${prefix}-${String(count).padStart(3, '0')}`;
};

// ============================================================
// @desc   Lấy tất cả Master Menu (branch_id = null) — Server-side Pagination
// @route  GET /api/v1/menus/master?page=1&limit=8&category=&search=
// @access Private (ADMIN)
// ============================================================
const getMasterMenus = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 8));
    const categoryFilter = req.query.category || '';   // e.g. "Khai Vị"
    const searchQuery = (req.query.search || '').trim().toLowerCase();

    const menus = await Menu.find({ branch_id: null }).populate('items.branches', 'name');

    // Flatten tất cả items từ mọi categories
    const allItems = [];
    menus.forEach(menu => {
      menu.items.forEach(item => {
        // Legacy support: items cũ có `price` nhưng không có `base_price`
        const itemBasePrice = item.base_price || item.price || 0;
        allItems.push({
          _id: item._id,
          menu_id: menu._id,
          category_name: menu.category_name,
          category: menu.category_name,
          name: item.name,
          sku: item.sku || '',
          description: item.description || '',
          dietary_tags: item.dietary_tags || [],
          base_price: itemBasePrice,
          min_price: item.min_price || 0,
          max_price: item.max_price || itemBasePrice,
          is_available: item.is_available !== undefined ? item.is_available : true,
          is_core_item: item.is_core_item || false,
          image_url: item.image_url || '',
          status: item.status || 'ACTIVE',
          branches: item.branches || [],
        });
      });
    });

    // ---- Filter by category ----
    let filtered = allItems;
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // ---- Filter by search ----
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery)
        || (item.description || '').toLowerCase().includes(searchQuery)
        || (item.sku || '').toLowerCase().includes(searchQuery)
      );
    }

    // ---- Pagination ----
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;
    const paginatedItems = filtered.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      message: 'Lấy Master Menu thành công.',
      data: {
        categories: menus.map(m => ({
          _id: m._id,
          category_name: m.category_name,
          item_count: m.items.length,
        })),
        items: paginatedItems,
        pagination: {
          page: safePage,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi getMasterMenus:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};



// ============================================================
// @desc   Thêm món ăn vào Master Menu (UC-7.3 Normal Flow)
// @route  POST /api/v1/menus/:menuId/items
// @access Private (ADMIN)
// Validates: BR-01 (Price Range), auto-generates SKU
// ============================================================
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

    const {
      name, description, dietary_tags, base_price,
      min_price, max_price, is_core_item, image_url,
      status, branches,
    } = req.body;

    // ---- BR-01: Validate Price Range (EX-7.3.1) ----
    const minP = min_price !== undefined ? min_price : 0;
    const maxP = max_price !== undefined ? max_price : base_price;
    const priceErrors = validatePriceRange(base_price, minP, maxP);

    if (priceErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Lỗi xác thực khoảng giá (BR-01).',
        errors: priceErrors,
      });
    }

    // Auto-generate SKU
    const totalItems = await Menu.aggregate([
      { $match: { branch_id: null } },
      { $unwind: '$items' },
      { $count: 'total' },
    ]);
    const currentCount = totalItems.length > 0 ? totalItems[0].total : 0;
    const sku = req.body.sku || generateSKU(menu.category_name, currentCount);

    // Filter valid ObjectIds from branches (FE might send mock IDs like '1', '3')
    const mongoose = require('mongoose');
    const validBranches = (branches || []).filter(id =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const newItem = {
      name,
      sku,
      description,
      dietary_tags: dietary_tags || [],
      base_price,
      price: base_price, // Backward compat
      min_price: minP,
      max_price: maxP,
      is_core_item: is_core_item || false,
      image_url: image_url || '',
      status: status || 'ACTIVE',
      branches: validBranches,
    };

    menu.items.push(newItem);
    await menu.save();

    // Lấy item vừa thêm (item cuối cùng)
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
// @desc   Cập nhật món ăn trong Master Menu (UC-7.3 Normal Flow)
// @route  PUT /api/v1/menus/:menuId/items/:itemId
// @access Private (ADMIN, MANAGER)
// Validates: BR-01, BR-03, EX-7.3.2
// ============================================================
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

    // ---- BR-01: Validate Price Range nếu có thay đổi giá ----
    const newBase = req.body.base_price !== undefined ? req.body.base_price : item.base_price;
    const newMin = req.body.min_price !== undefined ? req.body.min_price : item.min_price;
    const newMax = req.body.max_price !== undefined ? req.body.max_price : item.max_price;

    const priceErrors = validatePriceRange(newBase, newMin, newMax);
    if (priceErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Lỗi xác thực khoảng giá (BR-01).',
        errors: priceErrors,
      });
    }

    // ---- EX-7.3.2: Cảnh báo chi nhánh vi phạm khi thu hẹp khoảng giá ----
    const warnings = [];
    const isRangeNarrowed =
      (req.body.min_price !== undefined && req.body.min_price > item.min_price) ||
      (req.body.max_price !== undefined && req.body.max_price < item.max_price);

    if (isRangeNarrowed && menu.branch_id === null) {
      // Tìm tất cả branch menus có item override giá ngoài khoảng mới
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

    // ---- BR-03: Preserve Branch Overrides ----
    // Chỉ ghi log cảnh báo, KHÔNG ghi đè giá chi nhánh nếu vẫn hợp lệ

    // Cập nhật từng trường dữ liệu được gửi lên
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

    // Đính kèm warnings nếu có (EX-7.3.2)
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
// Validates: BR-02 (Core Item Lock — Admin có thể xóa, Manager thì không)
// ============================================================
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

    const item = menu.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn.' });
    }

    // ---- BR-02: Core Item Lock ----
    // Manager KHÔNG được xóa Core Items, chỉ được phép ẩn (set is_available = false)
    if (req.user.role === 'MANAGER' && item.is_core_item) {
      return res.status(403).json({
        success: false,
        message: 'Món ăn cốt lõi (Core Item) không thể bị xóa bởi Manager. Bạn chỉ có thể ẩn món này.',
      });
    }

    // Mongoose Subdocument: Dùng pull để xóa item khỏi array
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
// @desc   Toggle Core Item Lock (BR-02)
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
// @desc   Toggle item visibility (Hide/Show — cho Manager dùng thay Delete)
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

// ============================================================
// @desc   Lấy Menu của Chi nhánh dành cho Khách hàng (Public)
// @route  GET /api/v1/menus/public/:branchId
// @access Public
// ============================================================
const getPublicBranchMenu = async (req, res) => {
  try {
    const branchId = req.params.branchId;

    // 1. Lấy Local Menu
    const localMenus = await Menu.find({ branch_id: branchId }).lean();
    
    // 2. Lấy toàn bộ Master Menu
    const masterMenus = await Menu.find({ branch_id: null }).lean();

    const categoryMap = new Map();

    // Map Master Menus
    masterMenus.forEach(menu => {
      const items = menu.items.map(item => {
        // Tìm override cho chi nhánh này
        const override = item.branch_overrides?.find(o => String(o.branch_id) === String(branchId));
        return {
          _id: item._id,
          name: item.name,
          description: item.description,
          price: item.base_price,
          image: item.image_url,
          is_available: override && override.is_available !== undefined ? override.is_available : false,
          quantity: override && override.quantity !== undefined ? override.quantity : 0,
        };
      });

      if (!categoryMap.has(menu.category_name)) {
        categoryMap.set(menu.category_name, {
          name: menu.category_name,
          items: []
        });
      }
      categoryMap.get(menu.category_name).items.push(...items);
    });

    // Map Local Menus
    localMenus.forEach(menu => {
      const items = menu.items.map(item => ({
        _id: item._id,
        name: item.name,
        description: item.description,
        price: item.base_price,
        image: item.image_url,
        is_available: item.is_available !== undefined ? item.is_available : true,
        quantity: item.quantity !== undefined ? item.quantity : 0,
      }));
      
      if (!categoryMap.has(menu.category_name)) {
        categoryMap.set(menu.category_name, {
          name: menu.category_name,
          items: []
        });
      }
      categoryMap.get(menu.category_name).items.push(...items);
    });

    const combinedCategories = Array.from(categoryMap.values()).filter(c => c.items.length > 0);

    res.status(200).json({
      success: true,
      message: 'Lấy Menu chi nhánh thành công.',
      data: combinedCategories,
    });
  } catch (error) {
    console.error('Lỗi getPublicBranchMenu:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Cập nhật Override cho Master Item (is_available, quantity)
// @route  PATCH /api/v1/menus/master/:menuId/items/:itemId/override
// @access Private (MANAGER)
// ============================================================
const updateMasterItemOverride = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) {
      return res.status(403).json({ success: false, message: 'Tài khoản chưa được gán chi nhánh.' });
    }

    const { is_available, quantity } = req.body;
    
    const menu = await Menu.findOne({ _id: req.params.menuId, branch_id: null });
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục Master.' });
    }

    const item = menu.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn Master.' });
    }

    // Find override
    let override = item.branch_overrides.find(o => String(o.branch_id) === String(branchId));
    if (!override) {
      // Create new override
      override = {
        branch_id: branchId,
        is_available: is_available !== undefined ? is_available : item.is_available,
        quantity: quantity !== undefined ? quantity : -1
      };
      item.branch_overrides.push(override);
    } else {
      // Update existing
      if (is_available !== undefined) override.is_available = is_available;
      if (quantity !== undefined) override.quantity = quantity;
    }

    await menu.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái món ăn thành công.',
      data: override
    });
  } catch (error) {
    console.error('Lỗi updateMasterItemOverride:', error);
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
  getPublicBranchMenu
};