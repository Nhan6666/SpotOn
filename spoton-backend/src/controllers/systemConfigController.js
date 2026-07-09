const SystemConfig = require('../models/SystemConfig');

const BOOKING_RULES_KEY = 'DEFAULT_BOOKING_RULES';
const DEFAULT_RULES = {
  deposit_percent: 30,
  min_advance_hours: 2,
  max_advance_days: 30,
  max_party_size: 20,
  service_periods: {
    lunch:  { start: "08:00", end: "13:00", last_booking: "12:00", last_order: "12:30" },
    dinner: { start: "15:00", end: "23:00", last_booking: "22:00", last_order: "22:30" }
  },
  no_show_minutes: 30
};

// @desc   Lấy cấu hình chính sách đặt bàn toàn chuỗi
// @route  GET /api/v1/system-configs/booking-rules
// @access Private (ADMIN, MANAGER)
const getBookingRules = async (req, res) => {
  try {
    let config = await SystemConfig.findOne({ config_key: BOOKING_RULES_KEY });
    
    // Nếu chưa có trong DB, trả về default
    if (!config) {
      return res.status(200).json({
        success: true,
        message: 'Lấy cấu hình mặc định (chưa lưu DB).',
        data: DEFAULT_RULES
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy cấu hình thành công.',
      data: JSON.parse(config.config_value)
    });
  } catch (error) {
    console.error('Lỗi getBookingRules:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật cấu hình chính sách đặt bàn toàn chuỗi
// @route  PUT /api/v1/system-configs/booking-rules
// @access Private (ADMIN)
const updateBookingRules = async (req, res) => {
  try {
    const newRules = req.body;
    
    // Validate cơ bản
    if (newRules.deposit_percent < 0 || newRules.deposit_percent > 100) {
      return res.status(400).json({ success: false, message: 'Tỷ lệ cọc phải từ 0-100%.' });
    }

    const config = await SystemConfig.findOneAndUpdate(
      { config_key: BOOKING_RULES_KEY },
      { 
        config_value: JSON.stringify(newRules),
        description: 'Chính sách đặt bàn mặc định cho toàn chuỗi'
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật chính sách đặt bàn thành công.',
      data: JSON.parse(config.config_value)
    });
  } catch (error) {
    console.error('Lỗi updateBookingRules:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = {
  getBookingRules,
  updateBookingRules
};
