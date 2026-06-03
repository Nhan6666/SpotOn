const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema(
  {
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true }, // Có thể là HTML hoặc Markdown
    image_url: { type: String },
    is_published: { type: Boolean, default: true },
    tags: [{ type: String }], // VD: ["khuyến mãi", "sự kiện"]
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Article', ArticleSchema);
