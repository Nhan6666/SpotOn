const Amenity = require('../models/Amenity');

const DEFAULT_AMENITIES = [
  { name: 'Bãi đỗ xe ô tô', icon: 'Car', description: 'Có khu vực đỗ xe hơi rộng rãi' },
  { name: 'Khu vui chơi trẻ em', icon: 'Baby', description: 'Có nhà bóng, cầu trượt an toàn cho trẻ' },
  { name: 'Phòng riêng / VIP', icon: 'Crown', description: 'Phòng riêng biệt cho tiếp khách, hội họp' },
  { name: 'Chỗ ngồi ngoài trời', icon: 'Sun', description: 'Không gian thoáng đãng ngoài trời' },
  { name: 'Chỗ ngồi máy lạnh', icon: 'Wind', description: 'Khu vực trong nhà có điều hòa' },
  { name: 'Cho phép thú cưng', icon: 'Dog', description: 'Khách có thể mang theo thú cưng' },
  { name: 'Bàn lớn cho tiệc', icon: 'Users', description: 'Phù hợp cho nhóm đông người, tiệc công ty' },
  { name: 'Hỗ trợ xe lăn', icon: 'Wheelchair', description: 'Có lối đi riêng và nhà vệ sinh cho người khuyết tật' },
];

// @desc   Lấy tất cả tiện ích
// @route  GET /api/v1/amenities
// @access Public
const getAllAmenities = async (req, res) => {
  try {
    let amenities = await Amenity.find().sort({ created_at: -1 });

    // Tự động seed nếu database trống
    if (amenities.length === 0) {
      await Amenity.insertMany(DEFAULT_AMENITIES);
      amenities = await Amenity.find().sort({ created_at: -1 });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách tiện ích thành công.',
      data: amenities,
    });
  } catch (error) {
    console.error('Lỗi getAllAmenities:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Tạo tiện ích mới
// @route  POST /api/v1/amenities
// @access Private (ADMIN)
const createAmenity = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    
    // Check trùng tên
    const exists = await Amenity.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Tên tiện ích đã tồn tại.' });
    }

    const amenity = await Amenity.create({ name, icon, description });
    res.status(201).json({
      success: true,
      message: 'Tạo tiện ích thành công.',
      data: amenity,
    });
  } catch (error) {
    console.error('Lỗi createAmenity:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật tiện ích
// @route  PUT /api/v1/amenities/:id
// @access Private (ADMIN)
const updateAmenity = async (req, res) => {
  try {
    const { name, icon, description, is_active } = req.body;
    
    // Check trùng tên nếu đổi tên
    if (name) {
      const exists = await Amenity.findOne({ name, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Tên tiện ích đã tồn tại.' });
      }
    }

    const amenity = await Amenity.findByIdAndUpdate(
      req.params.id,
      { name, icon, description, is_active },
      { new: true, runValidators: true }
    );

    if (!amenity) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tiện ích.' });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật tiện ích thành công.',
      data: amenity,
    });
  } catch (error) {
    console.error('Lỗi updateAmenity:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Xóa tiện ích
// @route  DELETE /api/v1/amenities/:id
// @access Private (ADMIN)
const deleteAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndDelete(req.params.id);
    
    if (!amenity) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tiện ích.' });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa tiện ích thành công.',
      data: {},
    });
  } catch (error) {
    console.error('Lỗi deleteAmenity:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = {
  getAllAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
};
