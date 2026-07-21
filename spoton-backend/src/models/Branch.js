const mongoose = require('mongoose');

// ---- Sub-schema: Bàn vật lý ----
const TableSchema = new mongoose.Schema({
  table_number: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: {
    type: String,
    enum: ['EMPTY', 'HOLDING', 'LOCKED', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'],
    default: 'EMPTY',
  },
  status_lunch: {
    type: String,
    enum: ['EMPTY', 'HOLDING', 'LOCKED', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'],
    default: 'EMPTY',
  },
  status_dinner: {
    type: String,
    enum: ['EMPTY', 'HOLDING', 'LOCKED', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'],
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
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  tables: [TableSchema], // Nhúng mảng Tables vào Zone
});

// ---- Schema cha: Chi nhánh ----
const BranchSchema = new mongoose.Schema(
  {
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    address: {
      full: { type: String, required: true },
      city: { type: String, required: true, default: 'Cần Thơ' },
      district: { type: String, required: true },
      ward: { type: String },
      street: { type: String }
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere', required: true } // [lng, lat]
    },
    hotline: { type: String },
    images: [{ type: String }],
    service_periods: {
      type: Object,
      default: {
        lunch: { start: "08:00", end: "13:00", last_booking: "12:00", last_order: "12:30" },
        dinner: { start: "15:00", end: "23:00", last_booking: "22:00", last_order: "22:30" }
      }
    },
    description: { type: String, trim: true },
    status: { type: String, enum: ['OPEN', 'FULL', 'CLOSED'], default: 'OPEN' },
    overload_threshold: { type: Number, default: 85 }, // % công suất tối đa
    amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }], // Các tiện ích của chi nhánh
    disabled_vouchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' }], // Các voucher chung không được áp dụng
    
    // TÍNH NĂNG IPAD TẠI BÀN
    ipad_pin: { type: String, default: '1234' }, // Mật khẩu dùng nội bộ do manager set để mở khóa iPad
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Tự động tính toán trạng thái hoạt động dựa trên giờ Server (BR-05)
BranchSchema.virtual('current_operational_status').get(function() {
  // Nếu Admin đã chủ động đóng cửa hoặc báo Full trong DB thì ưu tiên DB
  if (this.status !== 'OPEN') return this.status;

  const now = new Date();
  // Chuyển đổi giờ server sang múi giờ Việt Nam (bắt buộc cho F&B)
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const currentHour = vnTime.getHours().toString().padStart(2, '0');
  const currentMinute = vnTime.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${currentHour}:${currentMinute}`;
  
  const lunch = this.service_periods?.lunch;
  const dinner = this.service_periods?.dinner;
  
  const isLunchTime = lunch && currentTimeStr >= lunch.start && currentTimeStr <= lunch.end;
  const isDinnerTime = dinner && currentTimeStr >= dinner.start && currentTimeStr <= dinner.end;
  
  // Nếu ngoài giờ phục vụ của cả Trưa và Tối -> Đóng cửa
  if (!isLunchTime && !isDinnerTime) {
    return 'CLOSED';
  }
  
  return 'OPEN';
});

module.exports = mongoose.model('Branch', BranchSchema);
