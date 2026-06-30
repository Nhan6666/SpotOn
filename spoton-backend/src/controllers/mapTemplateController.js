const MapTemplate = require('../models/MapTemplate');

// ============================================================
// TEMPLATE CRUD
// ============================================================

const getAllTemplates = async (req, res) => {
  try {
    const templates = await MapTemplate.find().select('name description created_at updated_at');
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error('Error getAllTemplates:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const template = await MapTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu' });
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error('Error getTemplateById:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Tên mẫu là bắt buộc' });
    const newTemplate = await MapTemplate.create({ 
      name, 
      description, 
      zones: [{ name: "Bản vẽ", capacity: 100, status: "OPEN" }] 
    });
    res.status(201).json({ success: true, data: newTemplate });
  } catch (error) {
    console.error('Error createTemplate:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { name, description } = req.body;
    const template = await MapTemplate.findByIdAndUpdate(req.params.id, { name, description }, { new: true });
    if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu' });
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error('Error updateTemplate:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const template = await MapTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu' });
    res.status(200).json({ success: true, message: 'Xóa mẫu thành công' });
  } catch (error) {
    console.error('Error deleteTemplate:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================================
// ZONE & TABLE CRUD (For Map Editor)
// ============================================================

const getZonesByTemplate = async (req, res) => {
  try {
    const template = await MapTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu' });
    
    // Tương thích với các mẫu cũ chưa có zone mặc định
    if (template.zones.length === 0) {
      template.zones.push({ name: "Bản vẽ", capacity: 100, status: "OPEN" });
      await template.save();
    }

    res.status(200).json({
      success: true,
      data: {
        branch_name: template.name, // Mock for frontend compatibility
        zones: template.zones,
        table_templates: [
          { label: "Bàn 2 người", capacity: 2, width: 70, height: 70, shape: "RECTANGLE", image_url: null },
          { label: "Bàn 4 người", capacity: 4, width: 120, height: 80, shape: "RECTANGLE", image_url: null },
          { label: "Bàn 8 người (CN)", capacity: 8, width: 200, height: 100, shape: "RECTANGLE", image_url: null },
          { label: "Bàn 8 người (Tròn)", capacity: 8, width: 160, height: 160, shape: "CIRCLE", image_url: null }
        ]
      }
    });
  } catch (error) {
    console.error('Error getZonesByTemplate:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const addZone = async (req, res) => {
  try {
    const { name, capacity } = req.body;
    const template = await MapTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu' });
    
    if (template.zones.find(z => z.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Khu vực đã tồn tại' });
    }
    
    template.zones.push({ name, capacity: capacity || 0, tables: [] });
    await template.save();
    res.status(201).json({ success: true, data: template.zones[template.zones.length - 1] });
  } catch (error) {
    console.error('Error addZone:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateZone = async (req, res) => {
  try {
    const { name, capacity, status } = req.body;
    const template = await MapTemplate.findById(req.params.id);
    const zone = template.zones.id(req.params.zoneId);
    if (!zone) return res.status(404).json({ success: false, message: 'Không tìm thấy khu vực' });
    
    if (name) zone.name = name;
    if (capacity !== undefined) zone.capacity = capacity;
    if (status) zone.status = status;
    
    await template.save();
    res.status(200).json({ success: true, data: zone });
  } catch (error) {
    console.error('Error updateZone:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const deleteZone = async (req, res) => {
  try {
    const template = await MapTemplate.findById(req.params.id);
    template.zones.pull(req.params.zoneId);
    await template.save();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleteZone:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const addTable = async (req, res) => {
  try {
    const template = await MapTemplate.findById(req.params.id);
    const zone = template.zones.id(req.params.zoneId);
    
    const { table_number, capacity, x, y, width, height, shape, image_url } = req.body;
    if (zone.tables.find(t => t.table_number === table_number)) {
      return res.status(400).json({ success: false, message: 'Số bàn đã tồn tại' });
    }
    
    zone.tables.push({ table_number, capacity, status: 'EMPTY', x, y, width, height, shape, image_url });
    await template.save();
    res.status(201).json({ success: true, data: zone.tables[zone.tables.length - 1] });
  } catch (error) {
    console.error('Error addTable:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateTable = async (req, res) => {
  try {
    const template = await MapTemplate.findById(req.params.id);
    const table = template.zones.id(req.params.zoneId).tables.id(req.params.tableId);
    
    const { table_number, capacity, x, y, width, height, shape, image_url } = req.body;
    if (table_number) table.table_number = table_number;
    if (capacity !== undefined) table.capacity = capacity;
    if (x !== undefined) table.x = x;
    if (y !== undefined) table.y = y;
    if (width !== undefined) table.width = width;
    if (height !== undefined) table.height = height;
    if (shape !== undefined) table.shape = shape;
    if (image_url !== undefined) table.image_url = image_url;
    
    await template.save();
    res.status(200).json({ success: true, data: table });
  } catch (error) {
    console.error('Error updateTable:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const deleteTable = async (req, res) => {
  try {
    const template = await MapTemplate.findById(req.params.id);
    template.zones.id(req.params.zoneId).tables.pull(req.params.tableId);
    await template.save();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleteTable:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const bulkUpdateTablesLayout = async (req, res) => {
  try {
    const template = await MapTemplate.findById(req.params.id);
    const zone = template.zones.id(req.params.zoneId);
    const { tables } = req.body;
    
    tables.forEach(tData => {
      const table = zone.tables.id(tData._id);
      if (table) {
        if (tData.x !== undefined) table.x = tData.x;
        if (tData.y !== undefined) table.y = tData.y;
      }
    });
    
    await template.save();
    res.status(200).json({ success: true, data: zone.tables });
  } catch (error) {
    console.error('Error bulkUpdateTablesLayout:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getAllTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate,
  getZonesByTemplate, addZone, updateZone, deleteZone,
  addTable, updateTable, deleteTable, bulkUpdateTablesLayout
};
