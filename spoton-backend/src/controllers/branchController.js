// ============================================================
// BRANCH CONTROLLER
// Xử lý: CRUD chi nhánh, quản lý Zone & Table
// ============================================================
const Branch = require('../models/Branch');
const User = require('../models/User');

// @desc   Lấy tất cả chi nhánh
// @route  GET /api/v1/branches
// @access Public
const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().populate('manager_id', 'full_name email phone');
    res.status(200).json({ 
      success: true, 
      message: 'Lấy danh sách chi nhánh thành công.',
      data: branches 
    });
  } catch (error) {
    console.error('Lỗi getAllBranches:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Lấy chi nhánh theo ID (bao gồm zones & tables)
// @route  GET /api/v1/branches/:id
// @access Public
const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('manager_id', 'full_name email phone')
      .populate('amenities');
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }
    res.status(200).json({ 
      success: true, 
      message: 'Lấy thông tin chi nhánh thành công.',
      data: branch 
    });
  } catch (error) {
    console.error('Lỗi getBranchById:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Tạo chi nhánh mới
// @route  POST /api/v1/branches
// @access Private (ADMIN)
const createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);

    // Sync manager
    if (branch.manager_id) {
      await User.findByIdAndUpdate(branch.manager_id, { branch_id: branch._id });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Tạo chi nhánh thành công.',
      data: branch 
    });
  } catch (error) {
    console.error('Lỗi createBranch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật thông tin chi nhánh
// @route  PUT /api/v1/branches/:id
// @access Private (ADMIN, MANAGER)
const updateBranch = async (req, res) => {
  try {
    const oldBranch = await Branch.findById(req.params.id);
    if (!oldBranch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    // TÍNH NĂNG PHÂN QUYỀN (Tenant-based Access):
    // Nếu là Manager, chỉ được phép sửa chi nhánh mà họ được phân công quản lý
    if (req.user.role === 'MANAGER' && String(req.user.branch_id) !== String(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông tin của chi nhánh này.'
      });
    }

    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Sync manager if changed
    if (req.body.manager_id !== undefined && String(oldBranch.manager_id) !== String(req.body.manager_id)) {
      if (oldBranch.manager_id) {
        await User.findByIdAndUpdate(oldBranch.manager_id, { $unset: { branch_id: 1 } });
      }
      if (req.body.manager_id) {
        await User.findByIdAndUpdate(req.body.manager_id, { branch_id: branch._id });
      }
    }

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật thông tin chi nhánh thành công.',
      data: branch 
    });
  } catch (error) {
    console.error('Lỗi updateBranch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Xóa chi nhánh
// @route  DELETE /api/v1/branches/:id
// @access Private (ADMIN)
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Xóa chi nhánh thành công.',
      data: {} 
    });
  } catch (error) {
    console.error('Lỗi deleteBranch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật trạng thái bàn trong chi nhánh
// @route  PATCH /api/v1/branches/:branchId/tables/:tableId/status
// @access Private (MANAGER, WAITER)
const updateTableStatus = async (req, res) => {
  try {
    const { branchId, tableId } = req.params;
    const { status } = req.body;

    // TÍNH NĂNG PHÂN QUYỀN (Tenant-based Access):
    // Manager và Waiter chỉ được phép đổi trạng thái bàn ở chi nhánh của mình
    if (['MANAGER', 'WAITER'].includes(req.user.role) && String(req.user.branch_id) !== String(branchId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác trên sơ đồ bàn của chi nhánh này.'
      });
    }

    const branch = await Branch.findOneAndUpdate(
      { _id: branchId },
      { $set: { 'zones.$[].tables.$[table].status': status } },
      {
        arrayFilters: [{ 'table._id': tableId }],
        new: true,
      }
    );

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh hoặc bàn.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Cập nhật trạng thái bàn thành công.',
      data: branch 
    });
  } catch (error) {
    console.error('Lỗi updateTableStatus:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// ZONE CRUD — Quản lý khu vực trong chi nhánh
// ============================================================

// @desc   Lấy danh sách zones (kèm tables) của chi nhánh
// @route  GET /api/v1/branches/:branchId/zones
// @access Private (ADMIN, MANAGER)
const getZonesByBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId).select('name address status zones table_templates');
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách khu vực thành công.',
      data: { branch_name: branch.name, branch_address: branch.address, branch_status: branch.status, zones: branch.zones, table_templates: branch.table_templates },
    });
  } catch (error) {
    console.error('Lỗi getZonesByBranch:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Thêm zone mới vào chi nhánh
// @route  POST /api/v1/branches/:branchId/zones
// @access Private (ADMIN, MANAGER)
const addZone = async (req, res) => {
  try {
    const { name, capacity } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên khu vực là bắt buộc.' });
    }

    const branch = await Branch.findById(req.params.branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    // Kiểm tra trùng tên zone
    const duplicateZone = branch.zones.find(z => z.name.toLowerCase() === name.toLowerCase());
    if (duplicateZone) {
      return res.status(400).json({ success: false, message: `Khu vực "${name}" đã tồn tại trong chi nhánh này.` });
    }

    branch.zones.push({ name, capacity: capacity || 0, tables: [] });
    await branch.save();

    const newZone = branch.zones[branch.zones.length - 1];
    res.status(201).json({
      success: true,
      message: `Thêm khu vực "${name}" thành công.`,
      data: newZone,
    });
  } catch (error) {
    console.error('Lỗi addZone:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật thông tin zone
// @route  PUT /api/v1/branches/:branchId/zones/:zoneId
// @access Private (ADMIN, MANAGER)
const updateZone = async (req, res) => {
  try {
    const { branchId, zoneId } = req.params;
    const { name, capacity, status } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    const zone = branch.zones.id(zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khu vực.' });
    }

    // Kiểm tra trùng tên (trừ chính nó)
    if (name) {
      const duplicateZone = branch.zones.find(
        z => z.name.toLowerCase() === name.toLowerCase() && String(z._id) !== String(zoneId)
      );
      if (duplicateZone) {
        return res.status(400).json({ success: false, message: `Khu vực "${name}" đã tồn tại.` });
      }
      zone.name = name;
    }
    if (capacity !== undefined) zone.capacity = capacity;
    if (status) zone.status = status;

    await branch.save();
    res.status(200).json({
      success: true,
      message: 'Cập nhật khu vực thành công.',
      data: zone,
    });
  } catch (error) {
    console.error('Lỗi updateZone:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Xóa zone (kèm tất cả tables bên trong)
// @route  DELETE /api/v1/branches/:branchId/zones/:zoneId
// @access Private (ADMIN, MANAGER)
const deleteZone = async (req, res) => {
  try {
    const { branchId, zoneId } = req.params;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    const zone = branch.zones.id(zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khu vực.' });
    }

    const zoneName = zone.name;
    branch.zones.pull(zoneId);
    await branch.save();

    res.status(200).json({
      success: true,
      message: `Xóa khu vực "${zoneName}" và tất cả bàn bên trong thành công.`,
      data: {},
    });
  } catch (error) {
    console.error('Lỗi deleteZone:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ============================================================
// TABLE CRUD — Quản lý bàn trong zone
// ============================================================

// @desc   Thêm bàn mới vào zone
// @route  POST /api/v1/branches/:branchId/zones/:zoneId/tables
// @access Private (ADMIN, MANAGER)
const addTable = async (req, res) => {
  try {
    const { branchId, zoneId } = req.params;
    const { table_number, capacity, x, y, width, height, shape, image_url } = req.body;

    if (!table_number || !capacity) {
      return res.status(400).json({ success: false, message: 'Số bàn và sức chứa là bắt buộc.' });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    const zone = branch.zones.id(zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khu vực.' });
    }

    // Kiểm tra trùng số bàn trong zone
    const duplicateTable = zone.tables.find(t => t.table_number === table_number);
    if (duplicateTable) {
      return res.status(400).json({ success: false, message: `Bàn số "${table_number}" đã tồn tại trong khu vực này.` });
    }

    zone.tables.push({ 
      table_number, 
      capacity, 
      status: 'EMPTY',
      x: x || 0,
      y: y || 0,
      width: width || 70,
      height: height || 70,
      shape: shape || 'RECTANGLE',
      image_url: image_url || null
    });
    await branch.save();

    const newTable = zone.tables[zone.tables.length - 1];
    res.status(201).json({
      success: true,
      message: `Thêm bàn "${table_number}" thành công.`,
      data: newTable,
    });
  } catch (error) {
    console.error('Lỗi addTable:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật thông tin bàn (table_number, capacity)
// @route  PUT /api/v1/branches/:branchId/zones/:zoneId/tables/:tableId
// @access Private (ADMIN, MANAGER)
const updateTable = async (req, res) => {
  try {
    const { branchId, zoneId, tableId } = req.params;
    const { table_number, capacity, status, x, y, width, height, shape, image_url } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    const zone = branch.zones.id(zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khu vực.' });
    }

    const table = zone.tables.id(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn.' });
    }

    // Kiểm tra trùng số bàn (trừ chính nó)
    if (table_number) {
      const duplicateTable = zone.tables.find(
        t => t.table_number === table_number && String(t._id) !== String(tableId)
      );
      if (duplicateTable) {
        return res.status(400).json({ success: false, message: `Bàn số "${table_number}" đã tồn tại.` });
      }
      table.table_number = table_number;
    }
    if (capacity !== undefined) table.capacity = capacity;
    if (status) table.status = status;
    if (x !== undefined) table.x = x;
    if (y !== undefined) table.y = y;
    if (width !== undefined) table.width = width;
    if (height !== undefined) table.height = height;
    if (shape !== undefined) table.shape = shape;
    if (image_url !== undefined) table.image_url = image_url;

    await branch.save();
    res.status(200).json({
      success: true,
      message: 'Cập nhật bàn thành công.',
      data: table,
    });
  } catch (error) {
    console.error('Lỗi updateTable:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Xóa bàn khỏi zone
// @route  DELETE /api/v1/branches/:branchId/zones/:zoneId/tables/:tableId
// @access Private (ADMIN, MANAGER)
const deleteTable = async (req, res) => {
  try {
    const { branchId, zoneId, tableId } = req.params;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    const zone = branch.zones.id(zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khu vực.' });
    }

    const table = zone.tables.id(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn.' });
    }

    const tableNumber = table.table_number;
    zone.tables.pull(tableId);
    await branch.save();

    res.status(200).json({
      success: true,
      message: `Xóa bàn "${tableNumber}" thành công.`,
      data: {},
    });
  } catch (error) {
    console.error('Lỗi deleteTable:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật tọa độ hàng loạt cho các bàn trong zone
// @route  PUT /api/v1/branches/:branchId/zones/:zoneId/tables/layout
// @access Private (ADMIN, MANAGER)
const bulkUpdateTablesLayout = async (req, res) => {
  try {
    const { branchId, zoneId } = req.params;
    const { tables } = req.body; // Array of { _id, x, y }

    if (!Array.isArray(tables)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu tables phải là một mảng.' });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    const zone = branch.zones.id(zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khu vực.' });
    }

    let updatedCount = 0;
    for (const tData of tables) {
      const table = zone.tables.id(tData._id);
      if (table) {
        if (tData.x !== undefined) table.x = tData.x;
        if (tData.y !== undefined) table.y = tData.y;
        if (tData.width !== undefined) table.width = tData.width;
        if (tData.height !== undefined) table.height = tData.height;
        updatedCount++;
      }
    }

    await branch.save();

    res.status(200).json({
      success: true,
      message: `Đã cập nhật tọa độ cho ${updatedCount} bàn.`,
      data: zone.tables,
    });
  } catch (error) {
    console.error('Lỗi bulkUpdateTablesLayout:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// @desc   Cập nhật mẫu bàn (table template)
// @route  PUT /api/v1/branches/:branchId/templates/:templateIndex
// @access Private (ADMIN, MANAGER)
const updateTableTemplate = async (req, res) => {
  try {
    const { branchId, templateIndex } = req.params;
    const { image_url } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    const index = parseInt(templateIndex, 10);
    if (isNaN(index) || index < 0 || index >= branch.table_templates.length) {
      return res.status(400).json({ success: false, message: 'Index mẫu bàn không hợp lệ.' });
    }

    // Only update image_url for Option 1
    branch.table_templates[index].image_url = image_url;
    await branch.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật mẫu bàn thành công.',
      data: branch.table_templates[index],
    });
  } catch (error) {
    console.error('Lỗi updateTableTemplate:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

const applyTemplate = async (req, res) => {
  try {
    const { branchId, zoneId } = req.params;
    const { templateId } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    const zone = branch.zones.id(zoneId);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khu vực.' });
    }

    const MapTemplate = require('../models/MapTemplate');
    const template = await MapTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sơ đồ mẫu.' });
    }

    if (template.zones.length === 0) {
      return res.status(400).json({ success: false, message: 'Sơ đồ mẫu không có dữ liệu bàn.' });
    }

    // Replace branch zone tables with template's first zone tables
    const templateTables = template.zones[0].tables;
    zone.tables = templateTables;
    
    await branch.save();

    res.status(200).json({
      success: true,
      message: 'Áp dụng sơ đồ mẫu thành công.',
      data: zone.tables
    });
  } catch (error) {
    console.error('Lỗi applyTemplate:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  updateTableStatus,
  getZonesByBranch,
  addZone,
  updateZone,
  deleteZone,
  addTable,
  updateTable,
  deleteTable,
  bulkUpdateTablesLayout,
  updateTableTemplate,
  applyTemplate,
};