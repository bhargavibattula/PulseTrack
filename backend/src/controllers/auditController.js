const AuditLog = require('../models/AuditLog');
const { ok } = require('../utils/response');

async function listAuditLogs(req, res, next) {
  try {
    const filter = req.user.role === 'MANAGER' ? {} : { unit: req.user.unit };
    if (req.query.unit_id && req.user.role === 'MANAGER') filter.unit = req.query.unit_id;
    if (req.query.entity_type) filter.entityType = req.query.entity_type;
    if (req.query.user_id) filter.user = req.query.user_id;

    const logs = await AuditLog.find(filter)
      .populate('user unit')
      .sort({ createdAt: -1 })
      .limit(200);
    return ok(res, logs);
  } catch (err) {
    next(err);
  }
}

module.exports = { listAuditLogs };
