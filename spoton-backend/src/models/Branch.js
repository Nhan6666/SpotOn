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
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('Branch', BranchSchema);
