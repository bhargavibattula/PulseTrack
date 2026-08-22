const mongoose = require('mongoose');
const Dispatch = require('../models/Dispatch');
const Intake = require('../models/Intake');

// SRS §24-§25: yield MUST be a weighted ratio of sums, never an average of daily percentages.
function windowBounds(window) {
  const days = window === '30d' ? 30 : 7; // DUMMY window rule — see CLARIFICATION_REQUIRED §48.9
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

async function computeYield({ window = '7d', unitId = null }) {
  const { start, end } = windowBounds(window);
  const unitFilter = unitId ? { unit: new mongoose.Types.ObjectId(unitId) } : {};

  const [dispatchAgg] = await Dispatch.aggregate([
    { $match: { ...unitFilter, date: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$quantityKg' } } },
  ]);
  const [intakeAgg] = await Intake.aggregate([
    { $match: { ...unitFilter, date: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$adjustedNetWeightKg' } } },
  ]);

  const totalDispatch = dispatchAgg?.total || 0;
  const totalIntake = intakeAgg?.total || 0;

  if (totalIntake === 0) {
    return { window, unitId, totalDispatchKg: totalDispatch, totalIntakeKg: 0, yieldPct: null };
  }

  const yieldPct = Math.round((totalDispatch / totalIntake) * 100 * 100) / 100;
  return { window, unitId, totalDispatchKg: totalDispatch, totalIntakeKg: totalIntake, yieldPct };
}

module.exports = { computeYield };
