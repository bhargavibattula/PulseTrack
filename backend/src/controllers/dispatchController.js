const Dispatch = require('../models/Dispatch');
// Removed inventoryService require
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function createDispatch(req, res, next) {
  try {
    const unit = req.user.role === 'MANAGER' ? req.body.unitId : req.user.unit;
    const { truckNumber, product, quantityKg, destinationReference } = req.body;
    if (!unit || quantityKg == null) throw Errors.validation('unitId and quantityKg are required.');

    const Location = require('../models/Location');
    const Material = require('../models/Material');
    const { recordStockTransactions } = require('../services/stockEngine');

    const [finLoc, finMat] = await Promise.all([
      Location.findOne({ unit, type: 'SILO', isActive: true, code: { $regex: /FIN/i } }) || Location.findOne({ unit, isActive: true }),
      Material.findOne({ code: 'MAIN_DAL', isActive: true }) || Material.findOne({ type: 'FINISHED', isActive: true })
    ]);

    const dispatch = await Dispatch.create({
      unit,
      truckNumber,
      product: product || 'FINISHED_TOOR_DAL',
      quantityKg,
      destinationReference,
      operator: req.user.id,
    });

    if (finLoc && finMat) {
      await recordStockTransactions([{
        unit,
        location: finLoc._id,
        material: finMat._id,
        direction: 'OUT',
        quantity: quantityKg,
        transactionType: 'OPERATOR_MOVEMENT',
        referenceType: 'Dispatch',
        referenceId: dispatch._id,
        createdBy: req.user.id
      }]);
    }

    await writeAudit({
      userId: req.user.id,
      action: 'DISPATCH_CREATED',
      entityType: 'Dispatch',
      entityId: dispatch._id,
      newValue: dispatch.toObject(),
      unitId: unit,
    });

    return created(res, dispatch);
  } catch (err) {
    next(err);
  }
}

async function listDispatch(req, res, next) {
  try {
    const filter = req.user.role === 'MANAGER' ? {} : { unit: req.user.unit };
    if (req.query.unit_id && req.user.role === 'MANAGER') filter.unit = req.query.unit_id;
    const dispatches = await Dispatch.find(filter).populate('unit operator').sort({ date: -1 }).limit(100);
    return ok(res, dispatches);
  } catch (err) {
    next(err);
  }
}

module.exports = { createDispatch, listDispatch };
