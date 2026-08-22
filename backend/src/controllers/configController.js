const { getCurrentConfig, setConfig } = require('../services/configService');
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');

async function getConfig(req, res, next) {
  try {
    const config = await getCurrentConfig(req.params.key, req.query.unit_id);
    return ok(res, config);
  } catch (err) {
    next(err);
  }
}

async function updateConfig(req, res, next) {
  try {
    const { value, scope, unitId } = req.body;
    const previous = await getCurrentConfig(req.params.key, unitId);
    const config = await setConfig({ key: req.params.key, value, scope, unitId, setBy: req.user.id });

    await writeAudit({
      userId: req.user.id,
      action: 'MOISTURE_CONFIGURATION_CHANGED',
      entityType: 'Configuration',
      entityId: config._id,
      previousValue: { value: previous.value },
      newValue: { value: config.value },
      unitId: unitId || null,
    });

    return created(res, config);
  } catch (err) {
    next(err);
  }
}

module.exports = { getConfig, updateConfig };
