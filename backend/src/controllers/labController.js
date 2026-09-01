const LabTest = require('../models/LabTest');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function createLabTest(req, res, next) {
  try {
    const unit = req.body.unitId || req.user.unit;
    if (!req.body.expectedRecoveryPct) {
      throw Errors.validation('expectedRecoveryPct is required.');
    }
    const test = await LabTest.create({
      unit,
      expectedRecoveryPct: req.body.expectedRecoveryPct,
      sampleReference: req.body.sampleReference || null,
      notes: req.body.notes || null,
      createdBy: req.user.id
    });
    return created(res, test);
  } catch (err) {
    next(err);
  }
}

async function listLabTests(req, res, next) {
  try {
    const filter = {};
    if (req.user.unit) filter.unit = req.user.unit;
    if (req.query.unit_id) filter.unit = req.query.unit_id;
    
    const tests = await LabTest.find(filter).populate('unit createdBy').sort({ testDate: -1 });
    return ok(res, tests);
  } catch (err) {
    next(err);
  }
}

module.exports = { createLabTest, listLabTests };
