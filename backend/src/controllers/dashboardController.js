const { ok } = require('../utils/response');
const { Errors } = require('../utils/errors');
const ProductionTransfer = require('../models/ProductionTransfer');
const StockTransaction = require('../models/StockTransaction');
const Location = require('../models/Location');
const mongoose = require('mongoose');

/**
 * Formats idle time from a lastActivityAt date to a human-readable string.
 */
function computeIdleTime(lastActivityAt) {
  if (!lastActivityAt) {
    return { idleTimeMinutes: null, idleTimeFormatted: 'No activity recorded' };
  }
  const now = new Date();
  const diffMs = now.getTime() - new Date(lastActivityAt).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  let formatted;
  if (diffMinutes < 1) {
    formatted = 'Active now';
  } else if (diffMinutes < 60) {
    formatted = `${diffMinutes}m idle`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    formatted = mins > 0 ? `${hours}h ${mins}m idle` : `${hours}h idle`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    const hours = Math.floor((diffMinutes % 1440) / 60);
    formatted = hours > 0 ? `${days}d ${hours}h idle` : `${days}d idle`;
  }

  return { idleTimeMinutes: diffMinutes, idleTimeFormatted: formatted };
}

exports.getSupervisorDashboard = async (req, res, next) => {
  try {
    const unitId = req.user.unit;
    if (!unitId) throw Errors.validation('Unit ID required for supervisor dashboard');

    // 1. Stock Adjustments (recent explicit manual adjustments by supervisors/managers)
    const StockAdjustment = require('../models/StockAdjustment');
    const recentAdjustments = await StockAdjustment.find({ unit: unitId })
      .populate('location material createdBy')
      .sort({ created_at: -1 })
      .limit(5)
      .lean();

    // 2. Silo Status (All locations with their last activity for idle-time calculation)
    const locations = await Location.find({ unit: unitId, isActive: true })
      .sort({ name: 1 })
      .lean();

    // Compute stock per silo for the dashboard
    const locStockAgg = await StockTransaction.aggregate([
      { $match: { location: { $in: locations.map(l => l._id) } } },
      { $group: {
          _id: '$location',
          totalIn: { $sum: { $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0] } }
      }}
    ]);
    const locStockMap = new Map();
    locStockAgg.forEach(s => {
      locStockMap.set(String(s._id), Math.max(0, s.totalIn - s.totalOut));
    });

    // Enrich locations with idle time and stock data
    const enrichedLocations = locations.map(loc => {
      const { idleTimeMinutes, idleTimeFormatted } = computeIdleTime(loc.lastActivityAt);
      const currentQty = locStockMap.get(String(loc._id)) || 0;
      const capacity = loc.capacityKg || 50000;
      const fillPercentage = Math.min(100, Math.round((currentQty / capacity) * 100));

      return {
        ...loc,
        idleTimeMinutes,
        idleTimeFormatted,
        currentQuantityKg: currentQty,
        currentQuantityTons: Math.round((currentQty / 1000) * 100) / 100,
        fillPercentage,
        status: fillPercentage >= 90 ? 'FULL' : fillPercentage > 0 ? 'FILLING' : 'EMPTY'
      };
    });

    // 3. System Exceptions (Transfers stuck waiting for yield)
    const pendingYields = await ProductionTransfer.find({ unit: unitId, status: 'PENDING_LAB' })
      .populate('process sourceLocation destinationLocation createdBy')
      .sort({ created_at: 1 }) // oldest first, as they are exceptions
      .limit(5)
      .lean();

    // 4. Overall Stock Aggregation
    const stockAgg = await StockTransaction.aggregate([
      { $match: { unit: new mongoose.Types.ObjectId(unitId) } },
      { $group: {
          _id: '$material',
          totalIn: { $sum: { $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0] } }
      }}
    ]);

    const Material = require('../models/Material');
    const materials = await Material.find().lean();
    const matMap = new Map();
    materials.forEach(m => matMap.set(String(m._id), m));

    const stock = stockAgg.map(s => {
      const mat = matMap.get(String(s._id));
      const netKg = Math.max(0, s.totalIn - s.totalOut);
      return {
        materialId: s._id,
        materialCode: mat?.code || 'UNKNOWN',
        materialName: mat?.name || 'Material',
        unitOfMeasure: mat?.unitOfMeasure || 'KG',
        netQuantity: netKg,
        netQuantityTons: Math.round((netKg / 1000) * 100) / 100
      };
    }).filter(s => s.netQuantity > 0);

    // 5. Recent Audit Logs
    const AuditLog = require('../models/AuditLog');
    const recentAuditLogs = await AuditLog.find({ unit: unitId })
      .populate('user')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 6. Summary stats
    const totalStockKg = stock.reduce((sum, s) => sum + s.netQuantity, 0);
    const idleSilosCount = enrichedLocations.filter(l => l.idleTimeMinutes != null && l.idleTimeMinutes > 480).length;

    return ok(res, {
      stock,
      siloStatus: enrichedLocations,
      recentAdjustments,
      exceptions: pendingYields,
      recentAuditLogs,
      summary: {
        totalStockKg,
        totalStockTons: Math.round((totalStockKg / 1000) * 100) / 100,
        totalSilos: enrichedLocations.length,
        idleSilosCount,
        pendingYieldsCount: pendingYields.length,
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOperatorDashboard = async (req, res, next) => {
  try {
    const unitId = req.user.unit;
    if (!unitId) throw Errors.validation('Unit ID required for operator dashboard');

    const pendingLabEntries = await ProductionTransfer.find({
      unit: unitId,
      status: 'PENDING_LAB'
    }).populate('process sourceLocation destinationLocation').sort({ created_at: -1 }).limit(10).lean();

    const recentEntries = await StockTransaction.find({ unit: unitId })
      .populate('location material')
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    const stockAgg = await StockTransaction.aggregate([
      { $match: { unit: new mongoose.Types.ObjectId(unitId) } },
      { $group: {
          _id: '$material',
          totalIn: { $sum: { $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0] } }
      }}
    ]);

    const Material = require('../models/Material');
    const materials = await Material.find().lean();
    const matMap = new Map();
    materials.forEach(m => matMap.set(String(m._id), m));

    const operationalStock = stockAgg.map(s => {
      const mat = matMap.get(String(s._id));
      const netKg = Math.max(0, s.totalIn - s.totalOut);
      return {
        materialId: s._id,
        materialCode: mat?.code || 'UNKNOWN',
        materialName: mat?.name || 'Material',
        unitOfMeasure: mat?.unitOfMeasure || 'KG',
        netQuantity: netKg,
        netQuantityTons: Math.round((netKg / 1000) * 100) / 100
      };
    }).filter(s => s.netQuantity > 0);

    // Silo status with idle time for operator view
    const locations = await Location.find({ unit: unitId, isActive: true }).sort({ name: 1 }).lean();
    const locStockAgg = await StockTransaction.aggregate([
      { $match: { location: { $in: locations.map(l => l._id) } } },
      { $group: {
          _id: '$location',
          totalIn: { $sum: { $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0] } }
      }}
    ]);
    const locStockMap = new Map();
    locStockAgg.forEach(s => locStockMap.set(String(s._id), Math.max(0, s.totalIn - s.totalOut)));

    const siloStatus = locations.map(loc => {
      const { idleTimeMinutes, idleTimeFormatted } = computeIdleTime(loc.lastActivityAt);
      const currentQty = locStockMap.get(String(loc._id)) || 0;
      return {
        ...loc,
        idleTimeMinutes,
        idleTimeFormatted,
        currentQuantityKg: currentQty,
        currentQuantityTons: Math.round((currentQty / 1000) * 100) / 100,
      };
    });

    return ok(res, {
      operationalStock,
      pendingLabEntries,
      recentEntries,
      siloStatus
    });
  } catch (error) {
    next(error);
  }
};
