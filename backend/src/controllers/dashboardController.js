const { ok } = require('../utils/response');
const { Errors } = require('../utils/errors');
const ProductionTransfer = require('../models/ProductionTransfer');
const StockTransaction = require('../models/StockTransaction');
const Location = require('../models/Location');
const mongoose = require('mongoose');

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

    // 3. System Exceptions (Transfers stuck waiting for yield)
    const pendingYields = await ProductionTransfer.find({ unit: unitId, status: 'PENDING_LAB' })
      .populate('process sourceLocation createdBy')
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
      return {
        materialId: s._id,
        materialCode: mat?.code || 'UNKNOWN',
        materialName: mat?.name || 'Material',
        unitOfMeasure: mat?.unitOfMeasure || 'KG',
        netQuantity: Math.max(0, s.totalIn - s.totalOut)
      };
    }).filter(s => s.netQuantity > 0);

    // 5. Recent Audit Logs
    const AuditLog = require('../models/AuditLog');
    const recentAuditLogs = await AuditLog.find({ unit: unitId })
      .populate('user')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return ok(res, {
      stock,
      siloStatus: locations,
      recentAdjustments,
      exceptions: pendingYields,
      recentAuditLogs
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
    }).populate('process sourceLocation').sort({ created_at: -1 }).limit(10).lean();

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
      return {
        materialId: s._id,
        materialCode: mat?.code || 'UNKNOWN',
        materialName: mat?.name || 'Material',
        unitOfMeasure: mat?.unitOfMeasure || 'KG',
        netQuantity: Math.max(0, s.totalIn - s.totalOut)
      };
    }).filter(s => s.netQuantity > 0);

    return ok(res, {
      operationalStock,
      pendingLabEntries,
      recentEntries
    });
  } catch (error) {
    next(error);
  }
};
