const mongoose = require('mongoose');
const Location = require('../models/Location');
const StockTransaction = require('../models/StockTransaction');
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function listSilos(req, res, next) {
  try {
    const filter = req.user.role === 'MANAGER' ? { isActive: true } : { unit: req.user.unit, isActive: true };
    if (req.query.unit_id && req.user.role === 'MANAGER') filter.unit = req.query.unit_id;
    
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
    const { unitId, name, code, capacityKg } = req.body;
    const unit = req.user.role === 'MANAGER' ? unitId : req.user.unit;
    const silo = await Location.create({
      unit,
      name,
      code: code || name.toUpperCase().replace(/\s+/g, '_'),
      type: 'SILO',
      capacityKg: capacityKg || 50000,
      isActive: true
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
    if (!SILO_STATUSES.includes(newStatus)) throw Errors.validation('Invalid status value.');

    const silo = await Silo.findById(req.params.id);
    if (!silo) throw Errors.notFound('Silo not found.');
    if (req.user.role !== 'MANAGER' && String(silo.unit) !== String(req.user.unit)) {
      throw Errors.unauthorizedUnit();
    }

    const allowed = ALLOWED_TRANSITIONS[silo.status] || [];
    if (!allowed.includes(newStatus)) {
      throw Errors.invalidStateTransition(
        `This silo cannot move from ${silo.status} to ${newStatus}.`
      );
    }

    const previousStatus = silo.status;
    silo.status = newStatus;
    await silo.save();

    await writeAudit({
      userId: req.user.id,
      action: 'SILO_STATUS_CHANGED',
      entityType: 'Silo',
      entityId: silo._id,
      previousValue: { status: previousStatus },
      newValue: { status: newStatus },
      unitId: silo.unit,
    });

    return ok(res, silo);
  } catch (err) {
    next(err);
  }
}

async function recordMovement(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { fromSiloId, toSiloId, materialType, quantityKg, shift } = req.body;
    if (!materialType || !quantityKg) throw Errors.validation('materialType and quantityKg are required.');

    // Derive pool type from material type for inventory sync.
    const poolTypeMap = {
      RAW_TOOR: 'RAW',
      DRIED_TOOR: 'RAW',
      GOTA: 'GOTA',
      FINISHED_DAL: 'FINISHED',
    };
    const poolType = poolTypeMap[materialType] || 'RAW';

    let fromSilo = null;
    let toSilo = null;
    let movement;

    await session.withTransaction(async () => {
      if (fromSiloId) {
        fromSilo = await Silo.findById(fromSiloId).session(session);
        if (!fromSilo) throw Errors.notFound('Source silo not found.');
        if (req.user.role !== 'MANAGER' && String(fromSilo.unit) !== String(req.user.unit)) {
          throw Errors.unauthorizedUnit();
        }
        if (fromSilo.currentQuantityKg < quantityKg) {
          throw Errors.insufficientInventory(fromSilo.currentQuantityKg, quantityKg);
        }
        fromSilo.currentQuantityKg -= quantityKg;
        await fromSilo.save({ session });
      }

      if (toSiloId) {
        toSilo = await Silo.findById(toSiloId).session(session);
        if (!toSilo) throw Errors.notFound('Destination silo not found.');
        toSilo.currentQuantityKg += quantityKg;
        toSilo.materialType = materialType;
        await toSilo.save({ session });
      }

      const docs = await SiloMovement.create(
        [{
          fromSilo: fromSiloId || null,
          toSilo: toSiloId || null,
          materialType,
          quantityKg,
          shift,
          operator: req.user.id,
        }],
        { session }
      );
      movement = docs[0];

      await writeAudit({
        userId: req.user.id,
        action: 'INVENTORY_TRANSFERRED',
        entityType: 'SiloMovement',
        entityId: movement._id,
        newValue: movement.toObject(),
        unitId: (fromSilo || toSilo)?.unit,
      }, session);
    });

    return created(res, movement);
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
}

module.exports = { listSilos, createSilo, getSilo, updateSiloStatus, recordMovement };
