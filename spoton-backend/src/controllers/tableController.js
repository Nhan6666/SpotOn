const Branch = require('../models/Branch');

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

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chi nhánh.' });
    }

    // Tìm bàn trong tất cả các zone
    let targetTable = null;
    let targetZone = null;
    for (const zone of branch.zones) {
      targetTable = zone.tables.id(tableId);
      if (targetTable) {
        targetZone = zone;
        break;
      }
    }

    if (!targetTable) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn.' });
    }

    // BR-1: Occupied Table Lock Restriction
    if (status === 'LOCKED' || status === 'MAINTENANCE') {
      if (['OCCUPIED', 'RESERVED'].includes(targetTable.status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Không thể khóa bàn đang có khách (OCCUPIED) hoặc đã đặt trước (RESERVED).' 
        });
      }
    }

    targetTable.status = status;
    await branch.save();

    // Phát sự kiện WebSocket để cập nhật UI Sơ đồ bàn realtime
    const io = require('../socket').getIO();
    io.to(`branch_${branchId}`).emit('table_status_changed', {
      action: status,
      branch_id: branchId,
      table_ids: [tableId]
    });

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
    await branch.save({ validateModifiedOnly: true });

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

    await branch.save({ validateModifiedOnly: true });
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

    if (table.status !== 'EMPTY') {
      return res.status(400).json({ success: false, message: 'Không thể xóa bàn đang có khách hoặc đã đặt trước.' });
    }

    const tableNumber = table.table_number;
    zone.tables.pull(tableId);
    await branch.save({ validateModifiedOnly: true });

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

    await branch.save({ validateModifiedOnly: true });

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
    await branch.save({ validateModifiedOnly: true });

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
    
    await branch.save({ validateModifiedOnly: true });

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
  updateTableStatus,
  addTable,
  updateTable,
  deleteTable,
  bulkUpdateTablesLayout,
  updateTableTemplate,
  applyTemplate,
};
