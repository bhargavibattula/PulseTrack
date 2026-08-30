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
      await debitPool(
        { unitId: sourceUnitId, poolType: poolType || 'RAW', quantityKg },
        session
      );
      await creditPool(
        { unitId: destinationUnitId, poolType: poolType || 'RAW', quantityKg },
        session
      );

      const docs = await InterUnitTransfer.create(
        [
          {
            sourceUnit: sourceUnitId,
            destinationUnit: destinationUnitId,
            materialType: materialType || 'RAW_TOOR',
            quantityKg,
            initiatedBy: req.user.id,
            referenceId: idempotencyKey,
            status: 'COMPLETED', // DUMMY: no-approval path, see CLARIFICATION_REQUIRED §48.3
          },
        ],
        { session }
      );
      transfer = docs[0];

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
