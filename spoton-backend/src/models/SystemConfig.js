const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema(
  {
    config_key: { type: String, required: true, unique: true },
    // Lưu JSON string để linh hoạt với các loại giá trị khác nhau
    config_value: { type: String, required: true },
    description: { type: String },
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
