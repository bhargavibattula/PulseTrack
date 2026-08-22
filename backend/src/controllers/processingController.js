const ProcessingRun = require('../models/ProcessingRun');
const Silo = require('../models/Silo');
const { creditPool, debitPool } = require('../services/inventoryService');
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function createProcessingRun(req, res, next) {
  try {
    const { stage, sourceSiloId, destinationSiloId, inputQuantityKg, outputQuantityKg, shift } = req.body;
    if (!['FIRST_PASS', 'SECOND_PASS'].includes(stage)) throw Errors.validation('Invalid stage.');

    const sourceSilo = await Silo.findById(sourceSiloId);
    if (!sourceSilo) throw Errors.notFound('Source silo not found.');
    if (req.user.role !== 'MANAGER' && String(sourceSilo.unit) !== String(req.user.unit)) {
      throw Errors.unauthorizedUnit();
    }
    if (sourceSilo.currentQuantityKg < inputQuantityKg) {
      throw Errors.insufficientInventory(sourceSilo.currentQuantityKg, inputQuantityKg);
    }

    sourceSilo.currentQuantityKg -= inputQuantityKg;
    await sourceSilo.save();

    if (destinationSiloId) {
      const destSilo = await Silo.findById(destinationSiloId);
      if (destSilo) {
        destSilo.currentQuantityKg += outputQuantityKg;
        destSilo.materialType = stage === 'FIRST_PASS' ? 'GOTA' : 'FINISHED_DAL';
        await destSilo.save();
      }
    }

    const poolType = stage === 'FIRST_PASS' ? 'GOTA' : 'FINISHED';
    await creditPool({ unitId: sourceSilo.unit, poolType, quantityKg: outputQuantityKg });

    const run = await ProcessingRun.create({
      unit: sourceSilo.unit,
      stage,
      sourceSilo: sourceSiloId,
      destinationSilo: destinationSiloId || null,
      inputQuantityKg,
      outputQuantityKg,
      shift,
      operator: req.user.id,
    });

    await writeAudit({
      userId: req.user.id,
      action: 'PROCESSING_RECORDED',
      entityType: 'ProcessingRun',
      entityId: run._id,
      newValue: run.toObject(),
      unitId: sourceSilo.unit,
    });

    return created(res, run);
  } catch (err) {
    next(err);
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
