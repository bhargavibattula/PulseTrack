const Location = require('../models/Location');
const StockTransaction = require('../models/StockTransaction');
const { recordStockTransactions } = require('../services/stockEngine');
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

const SILO_STATUSES = ['EMPTY', 'FILLING', 'FULL', 'IDLE', 'MAINTENANCE'];

async function listSilos(req, res, next) {
  try {
    const filter = { isActive: true };
    if (req.user.unit) filter.unit = req.user.unit;
    if (req.query.unit_id) filter.unit = req.query.unit_id;
    
    const locations = await Location.find(filter).populate('unit').sort({ name: 1 }).lean();

    // Query aggregate balances for each location
    const stockAgg = await StockTransaction.aggregate([
      { $match: { location: { $in: locations.map(l => l._id) } } },
      { $group: {
          _id: '$location',
          totalIn: { $sum: { $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0] } },
          totalOut: { $sum: { $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0] } }
      }}
    ]);

    const stockMap = new Map();
    stockAgg.forEach(s => {
      stockMap.set(String(s._id), Math.max(0, s.totalIn - s.totalOut));
    });

    const silosWithStock = locations.map(loc => {
      const currentQty = stockMap.get(String(loc._id)) || 0;
      const capacity = loc.capacityKg || 50000;
      const fillPercentage = Math.min(100, Math.round((currentQty / capacity) * 100));
      
      let status = 'EMPTY';
      if (fillPercentage >= 90) status = 'FULL';
      else if (fillPercentage > 0) status = 'FILLING';

      return {
        ...loc,
        currentQuantityKg: currentQty,
        fillPercentage,
        status
      };
    });

    return ok(res, silosWithStock);
  } catch (err) {
    next(err);
  }
}

async function createSilo(req, res, next) {
  try {
    const { unitId, name, code, capacityKg, type } = req.body;
    const unit = unitId || req.user.unit;
    if (!unit) throw Errors.validation('unit is required.');
    
    const silo = await Location.create({
      unit,
      name,
      code: code || name.toUpperCase().replace(/\s+/g, '_'),
      type: type || 'SILO',
      capacityKg: capacityKg || 50000,
      isActive: true,
      lastActivityAt: new Date()
    });
    return created(res, silo);
  } catch (err) {
    next(err);
  }
}

async function getSilo(req, res, next) {
  try {
    const silo = await Location.findById(req.params.id).populate('unit');
    if (!silo) throw Errors.notFound('Silo/Location not found.');
    
    const transactions = await StockTransaction.find({ location: silo._id })
      .sort({ created_at: -1 })
      .limit(50)
      .populate('createdBy material');
      
    return ok(res, { silo, transactions });
  } catch (err) {
    next(err);
  }
}

async function updateSiloStatus(req, res, next) {
  try {
    const { newStatus } = req.body;
    const location = await Location.findById(req.params.id);
    if (!location) throw Errors.notFound('Location/Silo not found.');

    if (req.user.unit && String(location.unit) !== String(req.user.unit)) {
      throw Errors.unauthorizedUnit();
    }

    location.lastActivityAt = new Date();
    await location.save();

    await writeAudit({
      userId: req.user.id,
      action: 'SILO_STATUS_CHANGED',
      entityType: 'Location',
      entityId: location._id,
      previousValue: { status: 'UPDATED' },
      newValue: { status: newStatus },
      unitId: location.unit,
    });

    return ok(res, location);
  } catch (err) {
    next(err);
  }
}

async function recordMovement(req, res, next) {
  try {
    const { fromLocationId, toLocationId, materialId, quantityKg } = req.body;
    if (!materialId || !quantityKg) throw Errors.validation('materialId and quantityKg are required.');

    const unit = req.user.unit;
    const transactions = [];

    if (fromLocationId) {
      transactions.push({
        unit,
        location: fromLocationId,
        material: materialId,
        direction: 'OUT',
        quantity: quantityKg,
        transactionType: 'OPERATOR_MOVEMENT',
        referenceType: 'LocationMovement',
        referenceId: fromLocationId,
        createdBy: req.user.id
      });
    }

    if (toLocationId) {
      transactions.push({
        unit,
        location: toLocationId,
        material: materialId,
        direction: 'IN',
        quantity: quantityKg,
        transactionType: 'OPERATOR_MOVEMENT',
        referenceType: 'LocationMovement',
        referenceId: toLocationId,
        createdBy: req.user.id
      });
    }

    const recorded = await recordStockTransactions(transactions);

    await writeAudit({
      userId: req.user.id,
      action: 'INVENTORY_TRANSFERRED',
      entityType: 'StockTransaction',
      entityId: recorded[0]?._id || req.user.id,
      newValue: { fromLocationId, toLocationId, materialId, quantityKg },
      unitId: unit,
    });

    return created(res, recorded);
  } catch (err) {
    next(err);
  }
}

module.exports = { listSilos, createSilo, getSilo, updateSiloStatus, recordMovement };
