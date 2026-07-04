const mongoose = require('mongoose');

// ---- Sub-schema: Bàn vật lý ----
const TableSchema = new mongoose.Schema({
  table_number: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: {
    type: String,
    enum: ['EMPTY', 'HOLDING', 'LOCKED', 'RESERVED', 'OCCUPIED', 'CLEANING'],
    default: 'EMPTY',
  },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  width: { type: Number, default: 70 },
  height: { type: Number, default: 70 },
  shape: { type: String, enum: ['RECTANGLE', 'CIRCLE'], default: 'RECTANGLE' },
  image_url: { type: String, default: null },
});

// ---- Sub-schema: Khu vực (Zone) ----
const ZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  tables: [TableSchema],
});

// ---- Schema: Sơ đồ mẫu (MapTemplate) ----
const MapTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    zones: [ZoneSchema], // Nhúng mảng Zones vào Template
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('MapTemplate', MapTemplateSchema);
