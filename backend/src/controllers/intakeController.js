const Intake = require('../models/Intake');
const { computeMoistureDeduction } = require('../services/moistureService');
const { getCurrentConfig } = require('../services/configService');
// Removed inventoryService require
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

// POST /intake/preview — server computes the live preview shown on the New Intake
// screen (design doc §41 UX). Does NOT persist anything.
async function previewIntake(req, res, next) {
  try {
    const { rawWeightKg, moisturePct, unitId } = req.body;
    if (rawWeightKg == null || moisturePct == null) {
      throw Errors.validation('rawWeightKg and moisturePct are required.');
    }
    if (moisturePct < 0 || moisturePct > 100) {
      throw Errors.validation('Please enter a valid moisture percentage.');
    }

    const config = await getCurrentConfig('TARGET_BASE_MOISTURE', unitId || req.user.unit);
    const result = computeMoistureDeduction({
      rawWeightKg,
      actualMoisturePct: moisturePct,
      targetMoisturePct: Number(config.value),
    });

    return ok(res, { ...result, targetMoisturePctUsed: Number(config.value) });
  } catch (err) {
    next(err);
  }
}

async function createIntake(req, res, next) {
  try {
    const { unitId, vehicleNumber, supplierReference, grossWeightKg, moisturePct } = req.body;
    const unit = req.user.role === 'MANAGER' ? unitId : req.user.unit;
    if (!unit) throw Errors.validation('unitId is required.');
    if (!vehicleNumber || grossWeightKg == null || moisturePct == null) {
      throw Errors.validation('vehicleNumber, grossWeightKg, moisturePct are required.');
    }
    if (moisturePct < 0 || moisturePct > 100) {
      throw Errors.validation('Please enter a valid moisture percentage.');
    }

    const config = await getCurrentConfig('TARGET_BASE_MOISTURE', unit);
    const targetMoisturePctUsed = Number(config.value);
    const { moistureDeductionKg, adjustedNetWeightKg } = computeMoistureDeduction({
      rawWeightKg: grossWeightKg,
      actualMoisturePct: moisturePct,
      targetMoisturePct: targetMoisturePctUsed,
    });

    const intake = await Intake.create({
      unit,
      vehicleNumber,
      supplierReference,
      grossWeightKg,
      moisturePct,
      targetMoisturePctUsed,
      moistureDeductionKg,
      adjustedNetWeightKg,
      operator: req.user.id,
    });

    // Record stock transaction in raw silo
    const Location = require('../models/Location');
    const Material = require('../models/Material');
    const { recordStockTransactions } = require('../services/stockEngine');

    const [rawLoc, rawMat] = await Promise.all([
      Location.findOne({ unit, type: 'SILO', isActive: true }),
      Material.findOne({ code: 'RAW_TOOR', isActive: true })
    ]);

    if (rawLoc && rawMat) {
      await recordStockTransactions([{
        unit,
        location: rawLoc._id,
        material: rawMat._id,
        direction: 'IN',
        quantity: adjustedNetWeightKg,
        transactionType: 'OPERATOR_MOVEMENT',
        referenceType: 'Intake',
        referenceId: intake._id,
        createdBy: req.user.id
      }]);
    }

    await writeAudit({
      userId: req.user.id,
      action: 'INTAKE_CREATED',
      entityType: 'Intake',
      entityId: intake._id,
      newValue: intake.toObject(),
      unitId: unit,
    });

    return created(res, intake);
  } catch (err) {
    next(err);
  }
}

async function listIntake(req, res, next) {
  try {
    const filter = req.user.role === 'MANAGER' ? {} : { unit: req.user.unit };
    if (req.query.unit_id && req.user.role === 'MANAGER') filter.unit = req.query.unit_id;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) filter.date.$lte = new Date(req.query.to);
    }

    const intakes = await Intake.find(filter).populate('unit operator').sort({ date: -1 }).limit(200);
    return ok(res, intakes);
  } catch (err) {
    next(err);
  }
}

async function getIntake(req, res, next) {
  try {
    const intake = await Intake.findById(req.params.id).populate('unit operator');
    if (!intake) throw Errors.notFound('Intake record not found.');
    if (req.user.role !== 'MANAGER' && String(intake.unit._id) !== String(req.user.unit)) {
      throw Errors.unauthorizedUnit();
    }
    return ok(res, intake);
  } catch (err) {
    next(err);
  }
}

module.exports = { previewIntake, createIntake, listIntake, getIntake };
