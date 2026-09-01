const ProductionTransfer = require('../models/ProductionTransfer');
const YieldResult = require('../models/YieldResult');
const YieldOutput = require('../models/YieldOutput');
const Material = require('../models/Material');
const { calculateMoistureAdjustedQuantity } = require('../services/moistureService');
const { validateYieldTotal, calculateYieldOutputs } = require('../services/yieldService');
const { recordStockTransactions } = require('../services/stockEngine');
const mongoose = require('mongoose');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');
const { writeAudit } = require('../services/auditService');

exports.createTransfer = async (req, res, next) => {
  try {
    const { unitId, shiftId, processId, sourceLocationId, processingQty, inputMoisture } = req.body;
    const unit = unitId || req.user.unit;
    
    let adjustedInputQty = processingQty;
    if (inputMoisture != null) {
      adjustedInputQty = calculateMoistureAdjustedQuantity(processingQty, inputMoisture);
    }

    const transfer = new ProductionTransfer({
      unit,
      shift: shiftId,
      process: processId,
      sourceLocation: sourceLocationId,
      processingQty,
      inputMoisture,
      adjustedInputQty,
      createdBy: req.user._id,
      status: 'PENDING_LAB'
    });

    await transfer.save();
    
    await writeAudit({
      userId: req.user.id,
      entityType: 'ProductionTransfer',
      entityId: transfer._id,
      action: 'CREATE',
      newValue: transfer.toObject(),
      unitId: unit
    });

    return created(res, transfer);
  } catch (error) {
    next(error);
  }
};

exports.submitYield = async (req, res, next) => {
  try {
    const { transferId, totalYieldPercent, outputs } = req.body;

    const transfer = await ProductionTransfer.findById(transferId);
    if (!transfer) throw Errors.notFound('Transfer not found');
    if (transfer.status !== 'PENDING_LAB') throw Errors.validation('Yield already submitted for this transfer');

    validateYieldTotal(outputs, totalYieldPercent);
    const calculatedOutputs = calculateYieldOutputs(transfer.processingQty, outputs);

    // Identify raw material for debiting source location
    const rawMaterial = await Material.findOne({ type: 'RAW', isActive: true }) || await Material.findOne({ isActive: true });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const yieldResult = new YieldResult({
        productionTransfer: transferId,
        totalYieldPercent,
        enteredBy: req.user.id
      });
      await yieldResult.save({ session });

      const yieldOutputDocs = calculatedOutputs.map(o => ({
        _id: new mongoose.Types.ObjectId(),
        yieldResult: yieldResult._id,
        destinationLocation: o.destinationLocationId,
        material: o.materialId,
        yieldPercent: o.yieldPercent,
        calculatedQty: o.calculatedQty,
        outputMoisture: o.outputMoisture,
        adjustedQty: o.adjustedQty
      }));
      await YieldOutput.insertMany(yieldOutputDocs, { session });

      const transactions = [];
      transactions.push({
        unit: transfer.unit,
        location: transfer.sourceLocation,
        material: rawMaterial?._id || outputs[0].materialId,
        direction: 'OUT',
        quantity: transfer.adjustedInputQty || transfer.processingQty,
        transactionType: 'PRODUCTION',
        referenceType: 'ProductionTransfer',
        referenceId: transfer._id,
        createdBy: req.user.id
      });

      for (const output of yieldOutputDocs) {
        transactions.push({
          unit: transfer.unit,
          location: output.destinationLocation,
          material: output.material,
          direction: 'IN',
          quantity: output.adjustedQty || output.calculatedQty,
          transactionType: 'YIELD',
          referenceType: 'YieldOutput',
          referenceId: output._id,
          createdBy: req.user.id
        });
      }

      transfer.status = 'COMPLETED';
      await transfer.save({ session });

      await recordStockTransactions(transactions, session);
      
      await session.commitTransaction();

      return ok(res, { yieldResult });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

exports.getPendingLab = async (req, res, next) => {
  try {
    const unitId = req.user.unit;
    const query = { status: 'PENDING_LAB' };
    if (unitId) query.unit = unitId;

    const transfers = await ProductionTransfer.find(query)
      .populate('process shift sourceLocation createdBy unit')
      .sort({ created_at: -1 })
      .lean();

    return ok(res, transfers);
  } catch (error) {
    next(error);
  }
};

exports.listTransfers = async (req, res, next) => {
  try {
    const unitId = req.user.unit || req.query.unitId;
    const query = {};
    if (unitId) query.unit = unitId;
    if (req.query.status) query.status = req.query.status;

    const transfers = await ProductionTransfer.find(query)
      .populate('process shift sourceLocation createdBy unit')
      .sort({ created_at: -1 })
      .lean();

    return ok(res, transfers);
  } catch (error) {
    next(error);
  }
};

exports.getTransferById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transfer = await ProductionTransfer.findById(id)
      .populate('process shift sourceLocation createdBy unit')
      .lean();

    if (!transfer) throw Errors.notFound('Production transfer not found');

    const yieldResult = await YieldResult.findOne({ productionTransfer: id }).populate('enteredBy').lean();
    let yieldOutputs = [];
    if (yieldResult) {
      yieldOutputs = await YieldOutput.find({ yieldResult: yieldResult._id })
        .populate('destinationLocation material')
        .lean();
    }

    return ok(res, {
      transfer,
      yieldResult,
      yieldOutputs
    });
  } catch (error) {
    next(error);
  }
};
