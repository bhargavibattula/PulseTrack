const Unit = require('../models/Unit');
const { ok, created } = require('../utils/response');

async function listUnits(req, res, next) {
  try {
    const units = await Unit.find({ isActive: true }).sort({ name: 1 });
    return ok(res, units);
  } catch (err) {
    next(err);
  }
}

async function createUnit(req, res, next) {
  try {
    const { name, code } = req.body;
    const unit = await Unit.create({ name, code, isActive: true });
    return created(res, unit);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUnits, createUnit };
