const Branch = require('../models/Branch');

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
    await branch.save({ validateModifiedOnly: true });

    const newZone = branch.zones[branch.zones.length - 1];
    res.status(201).json({
      success: true,
      message: `Thêm khu vực "${name}" thành công.`,
      data: newZone,
    });
  } catch (error) {
    console.error('Lỗi addZone:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi server nội bộ.' });
  }
};

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

    if (name) {
      const duplicateZone = branch.zones.find(
        z => z.name.toLowerCase() === name.toLowerCase() && String(z._id) !== String(zoneId)
      );
      if (duplicateZone) {
        return res.status(400).json({ success: false, message: `Khu vực "${name}" đã tồn tại.` });
      }
      zone.name = name;
    }
    if (status) {
      // BR-2: Zone Closure Cascade
      if (status === 'CLOSED' && zone.status !== 'CLOSED') {
        const hasOccupiedTables = zone.tables.some(t => ['OCCUPIED', 'RESERVED'].includes(t.status));
        if (hasOccupiedTables) {
          return res.status(400).json({ 
            success: false, 
            message: 'Không thể đóng khu vực đang có bàn sử dụng (OCCUPIED) hoặc đặt trước (RESERVED).' 
          });
        }
        
        // Khóa toàn bộ bàn trong Zone
        zone.tables.forEach(t => {
          t.status = 'LOCKED';
        });
      }
      zone.status = status;
    }

    await branch.save({ validateModifiedOnly: true });

    // Phát sự kiện WebSocket
    const io = require('../socket').getIO();
    io.to(`branch_${branchId}`).emit('ZONE_STATUS_CHANGED', {
      action: status,
      branch_id: branchId,
      zone_id: zoneId
    });
    
    if (status === 'CLOSED') {
       io.to(`branch_${branchId}`).emit('table_status_changed', {
         action: 'LOCKED',
         branch_id: branchId,
         table_ids: zone.tables.map(t => t._id)
       });
    }

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

    const hasNonEmptyTables = zone.tables.some(table => table.status !== 'EMPTY');
    if (hasNonEmptyTables) {
      return res.status(400).json({ success: false, message: 'Không thể xóa khu vực vì có bàn đang sử dụng hoặc đã đặt trước.' });
    }

    const zoneName = zone.name;
    branch.zones.pull(zoneId);
    await branch.save({ validateModifiedOnly: true });

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

module.exports = {
  getZonesByBranch,
  addZone,
  updateZone,
  deleteZone,
};
