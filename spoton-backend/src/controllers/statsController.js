const Booking = require('../models/Booking');
const Branch = require('../models/Branch');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

// @desc   Lấy dữ liệu Dashboard cho chi nhánh
// @route  GET /api/v1/stats/branch/:id/dashboard
// @access Private (Manager/Admin)
const getBranchDashboardStats = asyncHandler(async (req, res) => {
  const branchId = req.params.id;

  // Lỗ hổng IDOR Protection: Manager chỉ được xem chi nhánh của mình
  if (req.user && req.user.role === 'MANAGER' && String(req.user.branch_id) !== String(branchId)) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập dữ liệu chi nhánh này.' });
  }

  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
  }

  let startDate, endDate;
  if (req.query.startDate && req.query.endDate) {
    startDate = new Date(req.query.startDate);
    endDate = new Date(req.query.endDate);
  } else {
    // Mặc định là hôm nay
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
  }

  // Sửa lỗi Query: Dùng reservation_date thay vì booking_date
  const filteredBookings = await Booking.find({
    branch_id: branchId,
    reservation_date: { $gte: startDate, $lt: endDate }
  });

  // Doanh thu (Tính trên amount_collected thay vì total_amount)
  const revenueToday = filteredBookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.amount_collected || b.final_bill_amount || 0), 0);

  const ordersToday = filteredBookings.length;

  // Khách đang chờ: chưa được assign table (bảng mới là table_ids rỗng)
  const waitingCustomers = filteredBookings
    .filter(b => (b.status === 'PENDING_PAYMENT' || b.status === 'CONFIRMED') && (!b.table_ids || b.table_ids.length === 0))
    .reduce((sum, b) => sum + (b.guest_count || 0), 0);

  const totalCapacity = branch.zones
    .filter(z => z.status === 'OPEN')
    .reduce((sum, zone) => sum + (zone.capacity || 0), 0);

  // Sửa lỗi State: Dùng IN_USE thay cho SEATED
  const currentGuests = filteredBookings
    .filter(b => ['PENDING_PAYMENT', 'CONFIRMED', 'IN_USE'].includes(b.status))
    .reduce((sum, b) => sum + (b.guest_count || 0), 0);

  const currentCapacityPercent = totalCapacity > 0 ? (currentGuests / totalCapacity) * 100 : 0;
  const isOverloaded = branch.overload_threshold > 0 && currentCapacityPercent >= branch.overload_threshold;

  // Widget: Pending Feedback (Tính cho tất cả thời gian hoặc theo date range)
  const pendingFeedbackCount = await Review.countDocuments({
    branch_id: branchId,
    status: 'PENDING',
    is_deleted: { $ne: true },
    created_at: { $gte: startDate, $lt: endDate }
  });

  res.status(200).json({
    success: true,
    data: {
      revenueToday,
      ordersToday,
      waitingCustomers,
      currentCapacityPercent,
      isOverloaded,
      overloadThreshold: branch.overload_threshold || 85,
      branchStatus: branch.status,
      pendingFeedback: pendingFeedbackCount
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

  // Lấy các booking hôm nay (Sửa lỗi Query: Dùng reservation_date thay vì booking_date)
  const todayBookings = await Booking.find({
    reservation_date: { $gte: today, $lt: tomorrow }
  });

  const branches = await Branch.find({});

  // Doanh thu hôm nay (chỉ tính những booking COMPLETED, dùng amount_collected)
  const revenueToday = todayBookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.amount_collected || b.final_bill_amount || 0), 0);

  // Tổng số đơn hôm nay
  const ordersToday = todayBookings.length;

  // Tính toán Top Performing Branches
  const branchStats = {};
  branches.forEach(b => {
    branchStats[b._id.toString()] = {
      branch_id: b._id,
      branch_name: b.name,
      revenue: 0,
      orders: 0
    };
  });

  todayBookings.forEach(b => {
    if (b.branch_id && branchStats[b.branch_id.toString()]) {
      branchStats[b.branch_id.toString()].orders += 1;
      if (b.status === 'COMPLETED') {
        branchStats[b.branch_id.toString()].revenue += (b.amount_collected || b.final_bill_amount || 0);
      }
    }
  });

  const topPerformingBranches = Object.values(branchStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3); // Lấy Top 3 chi nhánh doanh thu cao nhất

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
      totalBranches: branches.length,
      topPerformingBranches
    }
  });
});

module.exports = {
  getBranchDashboardStats,
  getChainDashboardStats
};
