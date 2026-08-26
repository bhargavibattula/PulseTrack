const mongoose = require('mongoose');
const Intake = require('../models/Intake');
const Dispatch = require('../models/Dispatch');
const InventoryPool = require('../models/InventoryPool');
const Silo = require('../models/Silo');
const Shift = require('../models/Shift');
const Unit = require('../models/Unit');
const LabTest = require('../models/LabTest');
const ByProductRecord = require('../models/ByProductRecord');
const { computeYield } = require('../services/yieldService');
const { ok } = require('../utils/response');

// SRS §29 / §46: Consolidated manager dashboard — returns everything needed in one call
// to avoid a waterfall of 8+ API requests on the mobile dashboard screen.
async function managerDashboard(req, res, next) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const units = await Unit.find({ isActive: true }).sort({ name: 1 }).lean();

    const [
      yield7d,
      yield30d,
      intakeAgg,
      dispatchAgg,
      inventoryPools,
      latestLab,
      byProductSummary,
    ] = await Promise.all([
      computeYield({ window: '7d' }),
      computeYield({ window: '30d' }),
      Intake.aggregate([
        { $group: { _id: '$unit', totalAdjusted: { $sum: '$adjustedNetWeightKg' }, totalGross: { $sum: '$grossWeightKg' }, count: { $sum: 1 } } },
      ]),
      Dispatch.aggregate([
        { $group: { _id: '$unit', totalDispatched: { $sum: '$quantityKg' }, count: { $sum: 1 } } },
      ]),
      InventoryPool.aggregate([
        { $group: { _id: { unit: '$unit', poolType: '$poolType' }, total: { $sum: '$quantityKg' } } },
      ]),
      LabTest.findOne({}).sort({ testDate: -1 }).lean(),
      ByProductRecord.aggregate([
        { $group: { _id: '$category', total: { $sum: '$weightKg' } } },
      ]),
    ]);

    // Per-unit yield calculations
    const unitYields = await Promise.all(
      units.map(async (u) => {
        const y = await computeYield({ window: '7d', unitId: u._id.toString() });
        return { unitId: u._id, unitName: u.name, unitCode: u.code, yieldPct: y.yieldPct };
      })
    );

    // Reshape intake and dispatch aggregations into unit-keyed maps
    const intakeByUnit = {};
    for (const row of intakeAgg) {
      intakeByUnit[row._id.toString()] = row;
    }
    const dispatchByUnit = {};
    for (const row of dispatchAgg) {
      dispatchByUnit[row._id.toString()] = row;
    }

    // Total figures across all units
    const totalAdjustedIntake = intakeAgg.reduce((sum, r) => sum + r.totalAdjusted, 0);
    const totalDispatched = dispatchAgg.reduce((sum, r) => sum + r.totalDispatched, 0);

    // Current inventory totals by pool type
    const inventoryByPool = {};
    for (const row of inventoryPools) {
      const key = row._id.poolType;
      inventoryByPool[key] = (inventoryByPool[key] || 0) + row.total;
    }
    const totalInventory = Object.values(inventoryByPool).reduce((a, b) => a + b, 0);

    const expectedPct = latestLab?.expectedRecoveryPct ?? null;
    const variance30d = yield30d.yieldPct != null && expectedPct != null
      ? Math.round((yield30d.yieldPct - expectedPct) * 100) / 100
      : null;

    return ok(res, {
      totalAdjustedIntake: Math.round(totalAdjustedIntake * 100) / 100,
      totalDispatched: Math.round(totalDispatched * 100) / 100,
      totalInventory: Math.round(totalInventory * 100) / 100,
      inventoryByPool,
      yield7d,
      yield30d,
      expectedPct,
      variance30d,
      byProducts: byProductSummary,
      units: units.map((u) => {
        const uid = u._id.toString();
        const uy = unitYields.find((y) => y.unitId.toString() === uid);
        return {
          ...u,
          intake: intakeByUnit[uid] || { totalAdjusted: 0, totalGross: 0, count: 0 },
          dispatch: dispatchByUnit[uid] || { totalDispatched: 0, count: 0 },
          yieldPct: uy?.yieldPct ?? null,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

// SRS §30: Operator dashboard — unit-scoped, simple, fast.
async function operatorDashboard(req, res, next) {
  try {
    const unitId = req.user.unit;
    if (!unitId) return ok(res, { pools: [], silos: [], recentIntakes: [], pendingShifts: [] });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [pools, silos, recentIntakes, recentShifts] = await Promise.all([
      InventoryPool.find({ unit: unitId }).lean(),
      Silo.find({ unit: unitId }).sort({ name: 1 }).lean(),
      Intake.find({ unit: unitId })
        .sort({ date: -1 })
        .limit(5)
        .lean(),
      Shift.find({ unit: unitId })
        .sort({ date: -1 })
        .limit(5)
        .lean(),
    ]);

    return ok(res, { pools, silos, recentIntakes, recentShifts });
  } catch (err) {
    next(err);
  }
}

module.exports = { managerDashboard, operatorDashboard };
