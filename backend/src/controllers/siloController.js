const mongoose = require('mongoose');
const Silo = require('../models/Silo');
const SiloMovement = require('../models/SiloMovement');
// Removed inventoryService require
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

const { SILO_STATUSES } = Silo;

// Allowed transitions per design doc Section G.1 (SRS §13).
const ALLOWED_TRANSITIONS = {
  EMPTY: ['FILLING'],
  FILLING: ['FULL_SITTING'],
  FULL_SITTING: ['EMPTYING'],
  EMPTYING: ['EMPTY'],
};

async function listSilos(req, res, next) {
  try {
    const filter = req.user.role === 'MANAGER' ? {} : { unit: req.user.unit };
    if (req.query.unit_id && req.user.role === 'MANAGER') filter.unit = req.query.unit_id;
    const silos = await Silo.find(filter).populate('unit').sort({ name: 1 });
    return ok(res, silos);
  } catch (err) {
    next(err);
  }
}

async function createSilo(req, res, next) {
  try {
    const { unitId, name, capacityKg } = req.body;
    const silo = await Silo.create({ unit: unitId, name, capacityKg: capacityKg ?? null });
    return created(res, silo);
  } catch (err) {
    next(err);
  }
}

async function getSilo(req, res, next) {
  try {
    const silo = await Silo.findById(req.params.id).populate('unit');
    if (!silo) throw Errors.notFound('Silo not found.');
    if (req.user.role !== 'MANAGER' && String(silo.unit._id) !== String(req.user.unit)) {
      throw Errors.unauthorizedUnit();
    }
    const movements = await SiloMovement.find({ $or: [{ fromSilo: silo._id }, { toSilo: silo._id }] })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('operator');
    return ok(res, { silo, movements });
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

      // Sync inventory pools when material moves between units via silos,
      // or when material enters/leaves the silo system.
      const sourceUnitId = fromSilo?.unit;
      const destUnitId = toSilo?.unit;
      if (sourceUnitId && destUnitId && String(sourceUnitId) !== String(destUnitId)) {
        // Cross-unit silo movement: debit source unit pool, credit dest unit pool
        await debitPool({ unitId: sourceUnitId, poolType, quantityKg }, session);
        await creditPool({ unitId: destUnitId, poolType, quantityKg }, session);
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
