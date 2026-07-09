const mongoose = require('mongoose');

// ---- Sub-schema: Món ăn trong menu ----
const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, trim: true }, // UC-7.3: Mã SKU tự động (removed unique to avoid subdoc issues)
  description: { type: String },
  dietary_tags: [{ type: String }], // VD: ["vegetarian", "gluten-free"]
  price: { type: Number, min: 0 }, // Legacy field (backward compat with seed data)
  base_price: { type: Number, min: 0 }, // UC-7.3 NF-5: Giá cơ bản
  min_price: { type: Number, min: 0, default: 0 }, // UC-7.3 NF-5: Giá tối thiểu
  max_price: { type: Number, min: 0 }, // UC-7.3 NF-5: Giá tối đa
  is_available: { type: Boolean, default: true },
  is_core_item: { type: Boolean, default: false }, // UC-7.3 BR-02: Core Item Lock
  image_url: { type: String },
  status: {
    type: String,
    enum: ['ACTIVE', 'DRAFT', 'HIDDEN'],
    default: 'ACTIVE',
  },
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }], // Chi nhánh áp dụng
  branch_overrides: [{
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    is_available: { type: Boolean },
    quantity: { type: Number, default: -1 } // -1 = Unlimited
  }]
});

// Pre-save hook: ensure base_price is synced with price
MenuItemSchema.pre('save', function (next) {
  if (!this.base_price && this.price) {
    this.base_price = this.price;
  }
  if (!this.price && this.base_price) {
    this.price = this.base_price;
  }
  next();
});

// ---- Schema cha: Danh mục menu ----
const MenuSchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null, // null = Master Menu (toàn chuỗi)
    },
    category_name: { type: String, required: true, trim: true }, // VD: "Khai vị", "Đồ uống"
    items: [MenuItemSchema], // Nhúng mảng Items vào Category
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Menu', MenuSchema);
