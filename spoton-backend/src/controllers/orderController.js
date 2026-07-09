const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');

// @desc   Thêm món ăn bổ sung (UC-W03 Waiter POS)
// @route  POST /api/v1/orders/:id/items
// @access Private (Waiter/Manager)
const addAdditionalOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const BookingService = require('../services/bookingService');
    const { updatedBooking, newItems } = await BookingService.addAdditionalOrder(id, items, req.user);

    // Gửi Socket event xuống KDS Bếp
    try {
      const io = require('../socket').getIO();
      io.to(`branch_${updatedBooking.branch_id}_kitchen`).emit('new_order_kitchen', {
        bookingId: id,
        newItems: newItems,
        tableName: updatedBooking.assigned_tables?.map(t => t.table_number).join(', ')
      });
    } catch (e) {
      console.error('Socket error in addAdditionalOrder:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Gọi món thành công!',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Error adding additional order:', error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Lỗi server khi gọi thêm món' 
    });
  }
};

// @desc   Cập nhật trạng thái từng món ăn (KDS - Bếp & Waiter)
// @route  PATCH /api/v1/orders/:id/items/:itemId/status
// @access Private (Manager/Admin/Chef/Waiter)
const updateOrderItemStatus = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { status } = req.body; // PENDING | PREPARING | READY | SERVED

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt bàn.' });
    }

    const item = booking.order_items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn trong booking này.' });
    }

    const VALID_PREP_TRANSITIONS = {
      PENDING: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'PENDING'],
      READY: ['SERVED', 'PREPARING'],
      SERVED: [],
      CANCELLED: []
    };

    const allowed = VALID_PREP_TRANSITIONS[item.prep_status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển trạng thái món từ ${item.prep_status} sang ${status}.`
      });
    }

    const result = await Booking.updateOne(
      { _id: id, "order_items._id": itemId },
      { $set: { "order_items.$.prep_status": status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Lỗi cập nhật trạng thái món.' });
    }

    // Lấy lại dữ liệu mới nhất
    const updatedBooking = await Booking.findById(id);

    // Bắn WebSocket Event cho Frontend
    try {
      const io = require('../socket').getIO();
      io.to(`branch_${updatedBooking.branch_id}`).emit('order_status_changed', {
        bookingId: id,
        itemId,
        newStatus: status
      });
    } catch (e) {
      console.error('Socket error in updateOrderItemStatus:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái món thành công.',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Lỗi updateOrderItemStatus:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ khi cập nhật món.' });
  }
};

// @desc   Mở khóa iPad tại bàn (In-Dining Self-Ordering) bằng Table ID
// @route  POST /api/v1/orders/ipad/unlock-by-table
// @access Public (Xác thực bằng PIN do Manager thiết lập)
const unlockIpad = async (req, res) => {
  try {
    const { table_id, pin } = req.body;
    
    if (!table_id || !pin) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID Bàn và mã PIN.' });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(table_id)) {
      return res.status(400).json({ success: false, message: 'Mã ID Bàn không hợp lệ.' });
    }

    // 1. Tìm Booking đang IN_USE cho bàn này
    const booking = await Booking.findOne({
      status: 'IN_USE',
      table_ids: table_id
    }).populate('branch_id');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Bàn này chưa được kích hoạt.' });
    }

    // 2. Kiểm tra mã PIN của chi nhánh (hoặc mặc định '1234' nếu chưa set)
    const branchPin = booking.branch_id?.ipad_pin || '1234';
    if (branchPin !== pin) {
      return res.status(401).json({ success: false, message: 'Mã PIN không chính xác.' });
    }

    // Sinh Session Token bằng JWT (có payload role là IPAD)
    const token = jwt.sign(
      { 
        _id: booking._id, // ID của IPAD Session được coi là Booking ID
        role: 'IPAD',
        branch_id: booking.branch_id?._id || booking.branch_id,
        table_ids: booking.table_ids
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '4h' } // Hết hạn sau 4 tiếng (1 ca)
    );

    res.status(200).json({
      success: true,
      message: 'Mở khóa iPad thành công.',
      token,
      data: {
        booking_id: booking._id,
        branch_name: booking.branch_id?.name || 'Chi nhánh SpotOn',
        customer_name: booking.walk_in_name || 'Quý khách',
        order_items: booking.order_items || [],
        pre_order_total_amount: booking.pre_order_total_amount || 0,
        total_deposit_paid: booking.total_deposit_paid || 0,
        final_bill_amount: booking.final_bill_amount || 0
      }
    });

  } catch (error) {
    console.error('Lỗi unlockIpad:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi mở khóa iPad.' });
  }
};

module.exports = {
  addAdditionalOrder,
  updateOrderItemStatus,
  unlockIpad
};
