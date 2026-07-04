const mongoose = require('mongoose');

const AmenitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    icon: { type: String, required: true, default: 'CheckCircle' }, // Tên icon của lucide-react
    description: { type: String },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Amenity', AmenitySchema);
