const ShiftLog = require('../models/ShiftLog');
const Shift = require('../models/Shift');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function createShift(req, res, next) {
  try {
    const unit = req.body.unitId || req.user.unit;
    if (!unit) throw Errors.validation('unit is required.');

    const shiftLabel = req.body.shiftLabel || 'SHIFT_1';
    const shiftDate = req.body.date ? new Date(req.body.date) : new Date();

    const shiftLog = await ShiftLog.create({
      unit,
      shift: req.body.shiftId || null,
      shiftLabel,
      date: shiftDate,
      movementQuantityKg: req.body.movementQuantityKg || 0,
      processingQuantityKg: req.body.processingQuantityKg || 0,
      notes: req.body.notes || null,
      status: 'COMPLETED',
      operator: req.user.id
    });

    return created(res, shiftLog);
  } catch (err) {
    next(err);
  }
}

async function listShifts(req, res, next) {
  try {
    const filter = {};
    if (req.user.unit) filter.unit = req.user.unit;
    if (req.query.unit_id) filter.unit = req.query.unit_id;

    // First retrieve master shifts if requested, otherwise shift logs
    if (req.query.type === 'master') {
      const masterShifts = await Shift.find({ isActive: true }).sort({ startTime: 1 });
      return ok(res, masterShifts);
    }

    const shiftLogs = await ShiftLog.find(filter)
      .populate('unit operator shift')
      .sort({ date: -1 })
      .limit(100);

    return ok(res, shiftLogs);
  } catch (err) {
    next(err);
  }
}

async function updateShift(req, res, next) {
  try {
    const shift = await ShiftLog.findById(req.params.id);
    if (!shift) throw Errors.notFound('Shift record not found.');
    
    if (req.user.unit && String(shift.unit) !== String(req.user.unit)) {
      throw Errors.unauthorizedUnit();
    }
    
    Object.assign(shift, req.body);
    await shift.save();
    return ok(res, shift);
  } catch (err) {
    next(err);
  }
}

module.exports = { createShift, listShifts, updateShift };
