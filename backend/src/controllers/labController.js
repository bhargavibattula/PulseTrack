const LabTest = require('../models/LabTest');
const { ok, created } = require('../utils/response');

async function createLabTest(req, res, next) {
  try {
    const test = await LabTest.create({ ...req.body, createdBy: req.user.id });
    return created(res, test);
  } catch (err) {
    next(err);
  }
}

async function listLabTests(req, res, next) {
  try {
    const filter = req.query.unit_id ? { unit: req.query.unit_id } : {};
    const tests = await LabTest.find(filter).populate('unit createdBy').sort({ testDate: -1 });
    return ok(res, tests);
  } catch (err) {
    next(err);
  }
}

module.exports = { createLabTest, listLabTests };
