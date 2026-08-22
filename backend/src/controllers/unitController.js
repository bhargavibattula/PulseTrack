const Unit = require('../models/Unit');
const { ok, created } = require('../utils/response');

async function listUnits(req, res, next) {
  try {
    // Manager: all units. Operator/Supervisor: their own unit only (SRS §4).
    const filter = req.user.role === 'MANAGER' ? {} : { _id: req.user.unit };
    const units = await Unit.find(filter).sort({ name: 1 });
    return ok(res, units);
  } catch (err) {
    next(err);
  }
}

async function createUnit(req, res, next) {
  try {
    const { name, code } = req.body;
    const unit = await Unit.create({ name, code });
    return created(res, unit);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUnits, createUnit };
