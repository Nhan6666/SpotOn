const Booking = require('../models/Booking');
const Branch = require('../models/Branch');
const asyncHandler = require('../utils/asyncHandler');

// @desc   Lấy dữ liệu Dashboard cho chi nhánh
// @route  GET /api/v1/stats/branch/:id/dashboard
// @access Private (Manager/Admin)
const getBranchDashboardStats = asyncHandler(async (req, res) => {
  const branchId = req.params.id;

  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Lấy các booking hôm nay
  const todayBookings = await Booking.find({
    branch_id: branchId,
    booking_date: { $gte: today, $lt: tomorrow }
  });

  // Doanh thu hôm nay (chỉ tính những booking COMPLETED)
  const revenueToday = todayBookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  // Tổng số đơn hôm nay
  const ordersToday = todayBookings.length;

  // Khách đang chờ (PENDING, CONFIRMED chưa có bàn)
  const waitingCustomers = todayBookings
    .filter(b => (b.status === 'PENDING' || b.status === 'CONFIRMED') && (!b.assigned_table_id))
    .reduce((sum, b) => sum + (b.guest_count || 0), 0);

  // Tính % công suất quá tải hiện tại
  const totalCapacity = branch.zones
    .filter(z => z.status === 'OPEN')
    .reduce((sum, zone) => sum + (zone.capacity || 0), 0);

  const currentGuests = todayBookings
    .filter(b => ['PENDING', 'CONFIRMED', 'SEATED'].includes(b.status))
    .reduce((sum, b) => sum + (b.guest_count || 0), 0);

  const currentCapacityPercent = totalCapacity > 0 ? (currentGuests / totalCapacity) * 100 : 0;
  const isOverloaded = branch.overload_threshold > 0 && currentCapacityPercent >= branch.overload_threshold;

  res.status(200).json({
    success: true,
    data: {
      revenueToday,
      ordersToday,
      waitingCustomers,
      currentCapacityPercent,
      isOverloaded,
      overloadThreshold: branch.overload_threshold || 85,
      branchStatus: branch.status
    }
  });
});

// @desc   Lấy dữ liệu Dashboard toàn chuỗi
// @route  GET /api/v1/stats/chain/dashboard
// @access Private (Admin)
const getChainDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Lấy các booking hôm nay
  const todayBookings = await Booking.find({
    booking_date: { $gte: today, $lt: tomorrow }
  });

  const branches = await Branch.find({});

  // Doanh thu hôm nay (chỉ tính những booking COMPLETED)
  const revenueToday = todayBookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  // Tổng số đơn hôm nay
  const ordersToday = todayBookings.length;

  // Số chi nhánh đang mở cửa
  const activeBranches = branches.filter(b => b.status === 'OPEN').length;

  // Cảnh báo (Số chi nhánh đang FULL/Overload)
  const overloadedBranches = branches.filter(b => b.status === 'FULL').length;

  res.status(200).json({
    success: true,
    data: {
      revenueToday,
      ordersToday,
      activeBranches,
      overloadedBranches,
      totalBranches: branches.length
    }
  });
});

module.exports = {
  getBranchDashboardStats,
  getChainDashboardStats
};
