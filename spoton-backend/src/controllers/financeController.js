const Revenue = require('../models/Revenue');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');

// @desc   Lấy thống kê doanh thu (Revenue Stats)
// @route  GET /api/v1/finance/revenue
// @access Private (Admin/Manager)
exports.getRevenueStats = asyncHandler(async (req, res) => {
  const { branch_id, start_date, end_date } = req.query;
  const query = {};

  // Phân quyền: Manager chỉ xem được branch của mình
  if (req.user.role === 'MANAGER') {
    query.branch_id = req.user.branch_id;
  } else if (branch_id && branch_id !== 'ALL') {
    query.branch_id = branch_id;
  }

  if (start_date && end_date) {
    query.date = { 
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const revenues = await Revenue.find(query).populate('branch_id', 'name');

  // Tính tổng
  let totalRevenue = 0;
  let totalRefunds = 0;
  
  revenues.forEach(r => {
    if (r.amount > 0) totalRevenue += r.amount;
    if (r.amount < 0) totalRefunds += Math.abs(r.amount);
  });

  res.status(200).json({
    success: true,
    data: {
      total_revenue: totalRevenue,
      total_refunds: totalRefunds,
      net_revenue: totalRevenue - totalRefunds,
      count: revenues.length
    }
  });
});

// @desc   Sổ cái giao dịch (Tất cả biến động số dư)
// @route  GET /api/v1/finance/transactions
// @access Private (Admin/Manager)
exports.getTransactions = asyncHandler(async (req, res) => {
  const { branch_id, start_date, end_date, limit = 50 } = req.query;
  const query = {};

  if (req.user.role === 'MANAGER') {
    query.branch_id = req.user.branch_id;
  } else if (branch_id && branch_id !== 'ALL') {
    query.branch_id = branch_id;
  }

  if (start_date && end_date) {
    query.date = { 
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const transactions = await Revenue.find(query)
    .populate('branch_id', 'name')
    .populate('booking_id', 'reservation_date status customer_id walk_in_name')
    .sort({ date: -1 })
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    data: transactions
  });
});

// @desc   Kiểm toán hoàn tiền (Refund Audits)
// @route  GET /api/v1/finance/refunds
// @access Private (Admin/Manager)
exports.getRefundAudits = asyncHandler(async (req, res) => {
  const { branch_id, status } = req.query;
  const query = {
    $or: [
      { status: 'CANCELLED_REFUND_PENDING' },
      { status: 'REFUND_COMPLETED' }
    ]
  };

  if (req.user.role === 'MANAGER') {
    query.branch_id = req.user.branch_id;
  } else if (branch_id && branch_id !== 'ALL') {
    query.branch_id = branch_id;
  }

  if (status) {
    query.status = status;
  }

  const refunds = await Booking.find(query)
    .populate('branch_id', 'name')
    .populate('customer_id', 'full_name phone email')
    .sort({ 'refund_info.refund_completed_at': -1, updatedAt: -1 });

  res.status(200).json({
    success: true,
    data: refunds
  });
});
