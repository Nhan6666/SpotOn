const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Branch = require('../models/Branch');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// @desc   Lấy thông tin và cập nhật profile
// @route  GET/PUT /api/v1/users/profile
router.route('/profile')
  .get(protect, userController.getProfile)
  .put(protect, userController.updateProfile);

const { authorize } = require('../middlewares/authMiddleware');

// @desc   Lấy danh sách tất cả users (dành cho Admin phân quyền)
// @route  GET /api/v1/users/admin/list
// @access Private/Admin
router.get('/admin/list', protect, authorize('ADMIN'), userController.getAllUsers);

// @desc   Admin tạo tài khoản nhân viên
// @route  POST /api/v1/users/admin/create
// @access Private/Admin
router.post('/admin/create', protect, authorize('ADMIN'), userController.createUser);

// @desc   Cập nhật Role và Branch cho User
// @route  PUT /api/v1/users/admin/:id/role
// @access Private/Admin
router.put('/admin/:id/role', protect, authorize('ADMIN'), userController.updateUserRole);

// @desc   Admin xóa tài khoản Khách hàng
// @route  DELETE /api/v1/users/admin/:id
// @access Private/Admin
router.delete('/admin/:id', protect, authorize('ADMIN'), userController.deleteUser);


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
