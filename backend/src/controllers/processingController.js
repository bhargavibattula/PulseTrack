const mongoose = require('mongoose');
const ProcessingRun = require('../models/ProcessingRun');
const Silo = require('../models/Silo');
const { creditPool, debitPool } = require('../services/inventoryService');
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function createProcessingRun(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { stage, sourceSiloId, destinationSiloId, inputQuantityKg, outputQuantityKg, shift } = req.body;
    if (!['FIRST_PASS', 'SECOND_PASS'].includes(stage)) throw Errors.validation('Invalid stage.');
    if (!inputQuantityKg || !outputQuantityKg) throw Errors.validation('inputQuantityKg and outputQuantityKg are required.');

    const sourceSilo = await Silo.findById(sourceSiloId);
    if (!sourceSilo) throw Errors.notFound('Source silo not found.');
    if (req.user.role !== 'MANAGER' && String(sourceSilo.unit) !== String(req.user.unit)) {
      throw Errors.unauthorizedUnit();
    }
    if (sourceSilo.currentQuantityKg < inputQuantityKg) {
      throw Errors.insufficientInventory(sourceSilo.currentQuantityKg, inputQuantityKg);
    }

    let run;
    await session.withTransaction(async () => {
      // Debit the source inventory pool (SRS §21 — pools must stay in sync).
      // FIRST_PASS consumes RAW/DRYING material; SECOND_PASS consumes GOTA.
      const debitPoolType = stage === 'FIRST_PASS' ? 'RAW' : 'GOTA';
      await debitPool({ unitId: sourceSilo.unit, poolType: debitPoolType, quantityKg: inputQuantityKg }, session);

      // Credit the output inventory pool.
      const creditPoolType = stage === 'FIRST_PASS' ? 'GOTA' : 'FINISHED';
      await creditPool({ unitId: sourceSilo.unit, poolType: creditPoolType, quantityKg: outputQuantityKg }, session);

      // Update silo quantities.
      sourceSilo.currentQuantityKg -= inputQuantityKg;
      await sourceSilo.save({ session });

      if (destinationSiloId) {
        const destSilo = await Silo.findById(destinationSiloId).session(session);
        if (destSilo) {
          destSilo.currentQuantityKg += outputQuantityKg;
          destSilo.materialType = stage === 'FIRST_PASS' ? 'GOTA' : 'FINISHED_DAL';
          await destSilo.save({ session });
        }
      }

      const docs = await ProcessingRun.create(
        [{
          unit: sourceSilo.unit,
          stage,
          sourceSilo: sourceSiloId,
          destinationSilo: destinationSiloId || null,
          inputQuantityKg,
          outputQuantityKg,
          shift,
          operator: req.user.id,
        }],
        { session }
      );
      run = docs[0];

      await writeAudit({
        userId: req.user.id,
        action: 'PROCESSING_RECORDED',
        entityType: 'ProcessingRun',
        entityId: run._id,
        newValue: run.toObject(),
        unitId: sourceSilo.unit,
      }, session);
    });

    return created(res, run);
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
}

async function listProcessingRuns(req, res, next) {
  try {
    const filter = req.user.role === 'MANAGER' ? {} : { unit: req.user.unit };
    if (req.query.unit_id && req.user.role === 'MANAGER') filter.unit = req.query.unit_id;
    const runs = await ProcessingRun.find(filter)
      .populate('unit sourceSilo destinationSilo operator')
      .sort({ date: -1 })
      .limit(100);
    return ok(res, runs);
  } catch (err) {
    next(err);
  }
}

module.exports = { createProcessingRun, listProcessingRuns };
