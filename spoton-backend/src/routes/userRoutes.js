const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Branch = require('../models/Branch');

// @desc   Lấy danh sách managers chưa quản lý chi nhánh nào
// @route  GET /api/v1/users/managers?currentBranchId=xxx
// @access Public (tạm thời, sẽ thêm protect sau)
router.get('/managers', async (req, res, next) => {
  try {
    const { currentBranchId } = req.query;

    // Lấy tất cả các chi nhánh đã có manager_id (khác null)
    const branchQuery = { manager_id: { $ne: null } };
    // Nếu đang edit 1 chi nhánh, loại trừ chi nhánh đó ra
    // (để manager của chi nhánh này vẫn hiện trong dropdown)
    if (currentBranchId) {
      branchQuery._id = { $ne: currentBranchId };
    }

    const assignedBranches = await Branch.find(branchQuery).select('manager_id name');
    
    // Tạo map để biết manager nào đang quản lý chi nhánh nào
    const managerToBranchMap = {};
    assignedBranches.forEach(b => {
      if (b.manager_id) {
        managerToBranchMap[b.manager_id.toString()] = b.name;
      }
    });

    // Lấy TẤT CẢ managers
    const managers = await User.find({ role: 'MANAGER' }).select('_id full_name email');

    // Gắn thêm flag isAssigned
    const result = managers.map(m => {
      const assignedBranchName = managerToBranchMap[m._id.toString()];
      return {
        ...m.toObject(),
        isAssigned: !!assignedBranchName,
        assignedBranchName: assignedBranchName || null
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
