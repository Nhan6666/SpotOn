const Menu = require('../models/Menu');

// ============================================================
// @desc   Lấy danh sách Danh mục (Categories) cho Public Menu
// @route  GET /api/v1/menus/public/:branchId/categories
// @access Public
// ============================================================
const getPublicCategories = async (req, res) => {
  try {
    const branchId = req.params.branchId;

    const localMenus = await Menu.find({ branch_id: branchId }).select('category_name').lean();
    const masterMenus = await Menu.find({ branch_id: null }).select('category_name').lean();

    const categorySet = new Set();
    masterMenus.forEach(m => categorySet.add(m.category_name));
    localMenus.forEach(m => categorySet.add(m.category_name));

    const categories = Array.from(categorySet).map((name, index) => ({
      _id: `cat_${index}`, // Fake ID for FE
      category_name: name
    })).sort((a, b) => {
      if (a.category_name.toLowerCase() === 'combo') return -1;
      if (b.category_name.toLowerCase() === 'combo') return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục thành công.',
      data: categories,
    });
  } catch (error) {
    console.error('Lỗi getPublicCategories:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Lấy món ăn theo Danh mục cho Public Menu (Có phân trang)
// @route  GET /api/v1/menus/public/:branchId/items
// @access Public
// ============================================================
const getPublicMenuItems = async (req, res) => {
  try {
    const branchId = req.params.branchId;
    const category_name = req.query.category_name;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!category_name) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số category_name.' });
    }

    const localMenu = await Menu.findOne({ branch_id: branchId, category_name }).lean();
    const masterMenu = await Menu.findOne({ branch_id: null, category_name }).lean();

    const items = [];

    if (masterMenu && masterMenu.items) {
      masterMenu.items.forEach(item => {
        const override = item.branch_overrides?.find(o => String(o.branch_id) === String(branchId));
        items.push({
          _id: item._id,
          name: item.name,
          description: item.description,
          price: item.base_price,
          image_url: item.image_url,
          is_available: override && override.is_available !== undefined ? override.is_available : true,
          quantity: override && override.quantity !== undefined ? override.quantity : 0,
        });
      });
    }

    if (localMenu && localMenu.items) {
      localMenu.items.forEach(item => {
        items.push({
          _id: item._id,
          name: item.name,
          description: item.description,
          price: item.base_price,
          image_url: item.image_url,
          is_available: item.is_available !== undefined ? item.is_available : true,
          quantity: item.quantity !== undefined ? item.quantity : 0,
        });
      });
    }

    const showAll = req.query.show_all === 'true';
    const activeItems = showAll ? items : items.filter(i => i.is_available !== false);

    const total = activeItems.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(page, Math.max(1, totalPages));
    const skip = (safePage - 1) * limit;
    const paginatedItems = activeItems.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      message: 'Lấy món ăn thành công.',
      data: {
        items: paginatedItems,
        pagination: {
          page: safePage,
          limit,
          total,
          totalPages
        }
      },
    });
  } catch (error) {
    console.error('Lỗi getPublicMenuItems:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// @desc   Lấy toàn bộ Menu của Chi nhánh (Legacy/Full)
// @route  GET /api/v1/menus/public/branch/:branchId
// @access Public
// ============================================================
const getPublicBranchMenu = async (req, res) => {
  try {
    const branchId = req.params.branchId;

    let localMenus = [];
    if (branchId !== 'default') {
      localMenus = await Menu.find({ branch_id: branchId }).lean();
    }
    const masterMenus = await Menu.find({ branch_id: null }).lean();

    const categoryMap = new Map();

    masterMenus.forEach(menu => {
      const items = menu.items.map(item => {
        const override = branchId !== 'default' ? item.branch_overrides?.find(o => String(o.branch_id) === String(branchId)) : null;
        return {
          _id: item._id,
          name: item.name,
          description: item.description,
          price: item.base_price,
          image: item.image_url,
          is_available: branchId === 'default' ? true : (override && override.is_available !== undefined ? override.is_available : false),
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
// @desc   Lấy danh sách món ăn Best Seller
// @route  GET /api/v1/menus/public/best-sellers
// @access Public
// ============================================================
const getPublicBestSellers = async (req, res) => {
  try {
    const masterMenus = await Menu.find({ branch_id: null }).lean();
    let allItems = [];
    
    masterMenus.forEach(menu => {
      if (menu.items) {
        allItems.push(...menu.items);
      }
    });

    // Shuffle and pick 5 items
    allItems = allItems.sort(() => 0.5 - Math.random());
    const bestSellers = allItems.slice(0, 5).map(item => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      price: item.base_price,
      image: item.image_url,
    }));

    res.status(200).json({
      success: true,
      message: 'Lấy món Best Seller thành công.',
      data: bestSellers,
    });
  } catch (error) {
    console.error('Lỗi getPublicBestSellers:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = {
  getPublicCategories,
  getPublicMenuItems,
  getPublicBranchMenu,
  getPublicBestSellers
};
