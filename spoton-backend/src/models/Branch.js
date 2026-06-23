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
  name: { type: String, required: true }, // VD: "Sân vườn", "Tầng 1", "VIP"
  capacity: { type: Number },
  tables: [TableSchema], // Nhúng mảng Tables vào Zone
});

// ---- Schema cha: Chi nhánh ----
const BranchSchema = new mongoose.Schema(
  {
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    hotline: { type: String },
    images: [{ type: String }],
    open_time: { type: String },  // VD: "08:00"
    close_time: { type: String }, // VD: "22:00"
    status: { type: String, enum: ['OPEN', 'FULL', 'CLOSED'], default: 'OPEN' },
    overload_threshold: { type: Number, default: 95 }, // % công suất tối đa
    zones: [ZoneSchema], // Nhúng mảng Zones vào Branch
    table_templates: {
      type: [{
        label: String,
        capacity: Number,
        width: Number,
        height: Number,
        shape: String,
        image_url: String
      }],
      default: [
        { label: "Bàn 2 người", capacity: 2, width: 70, height: 70, shape: "RECTANGLE", image_url: null },
        { label: "Bàn 4 người", capacity: 4, width: 120, height: 80, shape: "RECTANGLE", image_url: null },
        { label: "Bàn 8 người (CN)", capacity: 8, width: 200, height: 100, shape: "RECTANGLE", image_url: null },
        { label: "Bàn 8 người (Tròn)", capacity: 8, width: 160, height: 160, shape: "CIRCLE", image_url: null }
      ]
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Branch', BranchSchema);
