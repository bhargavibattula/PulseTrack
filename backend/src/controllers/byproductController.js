const mongoose = require('mongoose');
const Byproduct = require('../models/Byproduct');
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function recordByproduct(req, res, next) {
  try {
    const unit = req.user.unit;
    const { category, weightKg, bagCount } = req.body;
    if (!category || weightKg == null || bagCount == null) {
      throw Errors.validation('category, weightKg, and bagCount are required.');
    }

    const byproduct = await Byproduct.create({
      unit,
      category,
      weightKg: Number(weightKg),
      bagCount: Number(bagCount),
      operator: req.user.id,
    });

    await writeAudit({
      userId: req.user.id,
      action: 'BYPRODUCT_RECORDED',
      entityType: 'Byproduct',
      entityId: byproduct._id,
      newValue: byproduct.toObject(),
      unitId: unit,
    });

    return created(res, byproduct);
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const unit = req.user.unit;
    const match = unit ? { unit: new mongoose.Types.ObjectId(unit) } : {};

    const cumulative = await Byproduct.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$weightKg' },
          totalBags: { $sum: '$bagCount' },
        },
      },
    ]);

    const recent = await Byproduct.find(unit ? { unit } : {})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('operator', 'name');

    return ok(res, { cumulative, recent });
  } catch (err) {
    next(err);
  }
}

module.exports = { recordByproduct, getSummary };
