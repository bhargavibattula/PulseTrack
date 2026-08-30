const Intake = require('../models/Intake');
const Dispatch = require('../models/Dispatch');
// Removed InventoryPool and ProcessingRun
const { ok } = require('../utils/response');

// Simple, dummy report aggregations — one per category listed in SRS §45.
// Real report shaping/filters/export formats can be layered on later.

async function intakeReport(req, res, next) {
  try {
    const rows = await Intake.aggregate([
      { $group: { _id: '$unit', totalGross: { $sum: '$grossWeightKg' }, totalAdjusted: { $sum: '$adjustedNetWeightKg' }, count: { $sum: 1 } } },
    ]);
    return ok(res, rows);
  } catch (err) {
    next(err);
  }
}

async function inventoryReport(req, res, next) {
  try {
    return ok(res, []);
  } catch (err) {
    next(err);
  }
}

async function productionReport(req, res, next) {
  try {
    return ok(res, []);
  } catch (err) {
    next(err);
  }
}

async function dispatchReport(req, res, next) {
  try {
    const rows = await Dispatch.aggregate([
      { $group: { _id: '$unit', totalDispatched: { $sum: '$quantityKg' }, count: { $sum: 1 } } },
    ]);
    return ok(res, rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { intakeReport, inventoryReport, productionReport, dispatchReport };
