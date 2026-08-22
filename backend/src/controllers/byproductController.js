const ByProductRecord = require('../models/ByProductRecord');
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function createByProduct(req, res, next) {
  try {
    const unit = req.user.role === 'MANAGER' ? req.body.unitId : req.user.unit;
    if (!unit) throw Errors.validation('unitId is required.');

    const record = await ByProductRecord.create({ ...req.body, unit, operator: req.user.id });

    await writeAudit({
      userId: req.user.id,
      action: 'BYPRODUCT_RECORDED',
      entityType: 'ByProductRecord',
      entityId: record._id,
      newValue: record.toObject(),
      unitId: unit,
    });

    return created(res, record);
  } catch (err) {
    next(err);
  }
}

async function byProductSummary(req, res, next) {
  try {
    const unit = req.user.role === 'MANAGER' ? req.query.unit_id : req.user.unit;
    const filter = unit ? { unit } : {};

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [today, cumulative] = await Promise.all([
      ByProductRecord.aggregate([
        { $match: { ...filter, date: { $gte: todayStart } } },
        { $group: { _id: '$category', total: { $sum: '$weightKg' } } },
      ]),
      ByProductRecord.aggregate([
        { $match: filter },
        { $group: { _id: '$category', total: { $sum: '$weightKg' } } },
      ]),
    ]);

    return ok(res, { today, cumulative });
  } catch (err) {
    next(err);
  }
}

module.exports = { createByProduct, byProductSummary };
