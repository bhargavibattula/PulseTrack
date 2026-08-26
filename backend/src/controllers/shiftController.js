const Shift = require('../models/Shift');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function createShift(req, res, next) {
  try {
    const unit = req.user.role === 'MANAGER' ? req.body.unitId : req.user.unit;
    if (!unit) throw Errors.validation('unitId is required.');

    // Prevent duplicate shift submissions (SRS §43 — duplicate submission guard).
    const shiftLabel = req.body.shiftLabel || 'SHIFT_1';
    const shiftDate = req.body.date ? new Date(req.body.date) : new Date();
    const dayStart = new Date(shiftDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(shiftDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await Shift.findOne({
      unit,
      shiftLabel,
      date: { $gte: dayStart, $lte: dayEnd },
    });
    if (existing) throw Errors.duplicateSubmission('A shift summary for this unit/date/shift already exists.');

    const shift = await Shift.create({ ...req.body, unit, shiftLabel, operator: req.user.id });
    return created(res, shift);
  } catch (err) {
    next(err);
  }
}

async function listShifts(req, res, next) {
  try {
    const filter = req.user.role === 'MANAGER' ? {} : { unit: req.user.unit };
    if (req.query.unit_id && req.user.role === 'MANAGER') filter.unit = req.query.unit_id;
    const shifts = await Shift.find(filter).populate('unit operator').sort({ date: -1 }).limit(100);
    return ok(res, shifts);
  } catch (err) {
    next(err);
  }
}

async function updateShift(req, res, next) {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) throw Errors.notFound('Shift not found.');
    if (req.user.role !== 'MANAGER' && String(shift.unit) !== String(req.user.unit)) {
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
