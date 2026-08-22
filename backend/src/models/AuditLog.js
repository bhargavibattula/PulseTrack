const mongoose = require('mongoose');

// Append-only. No update/delete routes are exposed for this model anywhere in the app.
const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. INTAKE_CREATED, SILO_STATUS_CHANGED, ...
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ unit: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
