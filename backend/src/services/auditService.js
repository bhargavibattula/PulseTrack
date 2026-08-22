const AuditLog = require('../models/AuditLog');

// Writes an audit row. Callers pass the same Mongoose session used for the
// surrounding transaction so the audit write can never diverge from the mutation
// it describes (design doc Section H.6).
async function writeAudit(
  { userId, action, entityType, entityId, previousValue = null, newValue = null, unitId },
  session = null
) {
  return AuditLog.create([{ user: userId, action, entityType, entityId, previousValue, newValue, unit: unitId }], {
    session,
  });
}

module.exports = { writeAudit };
