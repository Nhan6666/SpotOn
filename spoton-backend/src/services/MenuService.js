const Menu = require('../models/Menu');

class MenuService {
  /**
   * Validate BR-01: Price Range Validation
   * Min Price <= Base Price <= Max Price
   */
  static validatePriceRange(base_price, min_price, max_price) {
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
  }

  /**
   * Generate SKU for Master Item
   * Format: ITM-{CATEGORY_PREFIX}-{SEQUENCE}
   */
  static async generateSKU(categoryName) {
    const prefix = categoryName
      .replace(/[^a-zA-Z\s]/g, '')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3) || 'GEN';
      
    const totalItems = await Menu.aggregate([
      { $match: { branch_id: null } },
      { $unwind: '$items' },
      { $count: 'total' },
    ]);
    const currentCount = totalItems.length > 0 ? totalItems[0].total : 0;
    const count = currentCount + 1;
    
    return `ITM-${prefix}-${String(count).padStart(3, '0')}`;
  }

  /**
   * Get Paginated Master Menus using Aggregation Pipeline
   */
  static async getPaginatedMasterMenus(page, limit, categoryFilter, searchQuery) {
    // 1. Get Categories for tabs
    const categoryAgg = await Menu.aggregate([
      { $match: { branch_id: null } },
      { $project: { _id: 1, category_name: 1, item_count: { $size: "$items" } } }
    ]);

    // 2. Build Pipeline for Items
    const pipeline = [
      { $match: { branch_id: null } },
      { $unwind: "$items" }
    ];

    if (categoryFilter) {
      pipeline.push({ $match: { category_name: categoryFilter } });
    }

    if (searchQuery) {
      pipeline.push({
        $match: {
          $or: [
            { "items.name": { $regex: searchQuery, $options: 'i' } },
            { "items.description": { $regex: searchQuery, $options: 'i' } },
            { "items.sku": { $regex: searchQuery, $options: 'i' } }
          ]
        }
      });
    }

    // Đếm tổng
    const countPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Menu.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Projection
    pipeline.push({
      $project: {
        _id: "$items._id",
        menu_id: "$_id",
        category_name: 1,
        category: "$category_name",
        name: "$items.name",
        sku: { $ifNull: ["$items.sku", ""] },
        description: { $ifNull: ["$items.description", ""] },
        dietary_tags: { $ifNull: ["$items.dietary_tags", []] },
        base_price: { $ifNull: ["$items.base_price", "$items.price", 0] },
        min_price: { $ifNull: ["$items.min_price", 0] },
        max_price: { $ifNull: ["$items.max_price", "$items.base_price", "$items.price", 0] },
        is_available: { $ifNull: ["$items.is_available", true] },
        is_core_item: { $ifNull: ["$items.is_core_item", false] },
        image_url: { $ifNull: ["$items.image_url", ""] },
        status: { $ifNull: ["$items.status", "ACTIVE"] },
        branches: { $ifNull: ["$items.branches", []] }
      }
    });

    const paginatedItems = await Menu.aggregate(pipeline);
    await Menu.populate(paginatedItems, { path: 'branches', select: 'name' });

    return {
      categories: categoryAgg,
      items: paginatedItems,
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
      }
    };
  }
}

module.exports = MenuService;
