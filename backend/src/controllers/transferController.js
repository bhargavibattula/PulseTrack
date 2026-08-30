const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const InterUnitTransfer = require('../models/InterUnitTransfer');
// Removed inventoryService require
const { writeAudit } = require('../services/auditService');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

// SRS §20: atomic — both the debit and the credit succeed together, or neither is applied.
// CLARIFICATION_REQUIRED §48.3: who may transfer, and whether receiving-unit approval is
// required. DUMMY DEFAULT here: any authenticated operator/manager may transfer, no
// approval step, status is written straight to COMPLETED. Tighten once confirmed.
async function createTransfer(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { sourceUnitId, destinationUnitId, materialType, quantityKg, poolType, referenceId } = req.body;
    if (!sourceUnitId || !destinationUnitId || !quantityKg) {
      throw Errors.validation('sourceUnitId, destinationUnitId, quantityKg are required.');
    }
    if (sourceUnitId === destinationUnitId) {
      throw Errors.validation('Source and destination units must differ.');
    }

    const idempotencyKey = referenceId || uuidv4();

    // Duplicate-submission guard (SRS §43).
    const existing = await InterUnitTransfer.findOne({ referenceId: idempotencyKey });
    if (existing) throw Errors.duplicateSubmission();

    let transfer;
    await session.withTransaction(async () => {
      const Location = require('../models/Location');
      const Material = require('../models/Material');
      const { recordStockTransactions } = require('../services/stockEngine');

      const docs = await InterUnitTransfer.create(
        [
          {
            sourceUnit: sourceUnitId,
            destinationUnit: destinationUnitId,
            materialType: materialType || 'RAW_TOOR',
            quantityKg,
            initiatedBy: req.user.id,
            referenceId: idempotencyKey,
            status: 'COMPLETED',
          },
        ],
        { session }
      );
      transfer = docs[0];

      const [srcLoc, dstLoc, mat] = await Promise.all([
        Location.findOne({ unit: sourceUnitId, type: 'SILO', isActive: true }).session(session),
        Location.findOne({ unit: destinationUnitId, type: 'SILO', isActive: true }).session(session),
        Material.findOne({ code: materialType || 'RAW_TOOR', isActive: true }).session(session) || Material.findOne({ isActive: true }).session(session)
      ]);

      if (srcLoc && dstLoc && mat) {
        await recordStockTransactions([
          {
            unit: sourceUnitId,
            location: srcLoc._id,
            material: mat._id,
            direction: 'OUT',
            quantity: quantityKg,
            transactionType: 'OPERATOR_MOVEMENT',
            referenceType: 'InterUnitTransfer',
            referenceId: transfer._id,
            createdBy: req.user.id
          },
          {
            unit: destinationUnitId,
            location: dstLoc._id,
            material: mat._id,
            direction: 'IN',
            quantity: quantityKg,
            transactionType: 'OPERATOR_MOVEMENT',
            referenceType: 'InterUnitTransfer',
            referenceId: transfer._id,
            createdBy: req.user.id
          }
        ], session);
      }

      await writeAudit(
        {
          userId: req.user.id,
          action: 'INTER_UNIT_TRANSFER_CREATED',
          entityType: 'InterUnitTransfer',
          entityId: transfer._id,
          newValue: transfer.toObject(),
          unitId: sourceUnitId,
        },
        session
      );
    });

    return created(res, transfer);
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
}

async function listTransfers(req, res, next) {
  try {
    const filter =
      req.user.role === 'MANAGER'
        ? {}
        : { $or: [{ sourceUnit: req.user.unit }, { destinationUnit: req.user.unit }] };
    const transfers = await InterUnitTransfer.find(filter)
      .populate('sourceUnit destinationUnit initiatedBy')
      .sort({ createdAt: -1 })
      .limit(100);
    return ok(res, transfers);
  } catch (err) {
    next(err);
  }
}

module.exports = { createTransfer, listTransfers };
