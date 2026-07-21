const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'entity' },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    old_value: { type: mongoose.Schema.Types.Mixed },
    new_value: { type: mongoose.Schema.Types.Mixed },
    description: { type: String }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
