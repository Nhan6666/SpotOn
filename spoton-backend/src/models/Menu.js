const mongoose = require('mongoose');

// ---- Sub-schema: Món ăn trong menu ----
const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  dietary_tags: [{ type: String }], // VD: ["vegetarian", "gluten-free"]
  price: { type: Number, required: true, min: 0 },
  is_available: { type: Boolean, default: true },
  image_url: { type: String },
});

// ---- Schema cha: Danh mục menu ----
const MenuSchema = new mongoose.Schema(
  {
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null, // null = Menu dùng chung cho toàn chuỗi
    },
    category_name: { type: String, required: true, trim: true }, // VD: "Khai vị", "Đồ uống"
    items: [MenuItemSchema], // Nhúng mảng Items vào Category
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Menu', MenuSchema);
