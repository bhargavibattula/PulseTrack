const Intake = require('../models/Intake');
const Dispatch = require('../models/Dispatch');
const StockTransaction = require('../models/StockTransaction');
const ProductionTransfer = require('../models/ProductionTransfer');
const { ok } = require('../utils/response');
const mongoose = require('mongoose');

async function intakeReport(req, res, next) {
  try {
    const match = {};
    if (req.user.unit) match.unit = new mongoose.Types.ObjectId(req.user.unit);
    if (req.query.unit_id) match.unit = new mongoose.Types.ObjectId(req.query.unit_id);

    const rows = await Intake.aggregate([
      { $match: match },
      { 
        $group: { 
          _id: '$unit', 
          totalGross: { $sum: '$grossWeightKg' }, 
          totalAdjusted: { $sum: '$adjustedNetWeightKg' }, 
          totalMoistureDeduction: { $sum: '$moistureDeductionKg' },
          count: { $sum: 1 } 
        } 
      },
    ]);
    return ok(res, rows);
  } catch (err) {
    next(err);
  }
}

async function inventoryReport(req, res, next) {
  try {
    const match = {};
    if (req.user.unit) match.unit = new mongoose.Types.ObjectId(req.user.unit);
    if (req.query.unit_id) match.unit = new mongoose.Types.ObjectId(req.query.unit_id);

    const rows = await StockTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { location: '$location', material: '$material' },
          totalIn: { $sum: { $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0] } },
          lastUpdated: { $max: '$created_at' }
        }
      }
    ]);
    return ok(res, rows);
  } catch (err) {
    next(err);
  }
}

async function productionReport(req, res, next) {
  try {
    const match = {};
    if (req.user.unit) match.unit = new mongoose.Types.ObjectId(req.user.unit);
    if (req.query.unit_id) match.unit = new mongoose.Types.ObjectId(req.query.unit_id);

    const rows = await ProductionTransfer.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          totalProcessedQty: { $sum: '$processingQty' },
          totalAdjustedQty: { $sum: '$adjustedInputQty' },
          count: { $sum: 1 }
        }
      }
    ]);
    return ok(res, rows);
  } catch (err) {
    next(err);
  }
}

async function dispatchReport(req, res, next) {
  try {
    const match = {};
    if (req.user.unit) match.unit = new mongoose.Types.ObjectId(req.user.unit);
    if (req.query.unit_id) match.unit = new mongoose.Types.ObjectId(req.query.unit_id);

    const rows = await Dispatch.aggregate([
      { $match: match },
      { $group: { _id: '$unit', totalDispatched: { $sum: '$quantityKg' }, count: { $sum: 1 } } },
    ]);
    return ok(res, rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { intakeReport, inventoryReport, productionReport, dispatchReport };
