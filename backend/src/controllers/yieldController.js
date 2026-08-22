const { computeYield } = require('../services/yieldService');
const { getCurrentConfig } = require('../services/configService');
const LabTest = require('../models/LabTest');
const { ok } = require('../utils/response');

async function getYield(req, res, next) {
  try {
    const window = req.query.window === '30d' ? '30d' : '7d';
    const unitId = req.user.role === 'MANAGER' ? req.query.unit_id || null : req.user.unit;
    const result = await computeYield({ window, unitId });
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

// DUMMY combination rule: takes the most recent lab test's expected recovery as
// "the" baseline. SRS §48.8 leaves the real combination rule (multiple tests) open.
async function getVariance(req, res, next) {
  try {
    const window = req.query.window === '30d' ? '30d' : '7d';
    const unitId = req.user.role === 'MANAGER' ? req.query.unit_id || null : req.user.unit;

    const [actual, latestLab] = await Promise.all([
      computeYield({ window, unitId }),
      LabTest.findOne(unitId ? { unit: unitId } : {}).sort({ testDate: -1 }),
    ]);

    const expectedPct = latestLab?.expectedRecoveryPct ?? null;
    const variance = actual.yieldPct != null && expectedPct != null ? Math.round((actual.yieldPct - expectedPct) * 100) / 100 : null;

    return ok(res, { ...actual, expectedPct, variance });
  } catch (err) {
    next(err);
  }
}

module.exports = { getYield, getVariance };
