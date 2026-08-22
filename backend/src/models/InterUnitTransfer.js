const mongoose = require('mongoose');

const interUnitTransferSchema = new mongoose.Schema(
  {
    sourceUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    destinationUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    materialType: { type: String, required: true },
    quantityKg: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referenceId: { type: String, required: true, unique: true }, // idempotency, SRS §19
    // CLARIFICATION_REQUIRED §48.3: approval workflow. Both branches supported by this enum.
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'REJECTED', 'FAILED'],
      default: 'COMPLETED', // DUMMY default: no-approval-required path, until §48.3 is confirmed
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterUnitTransfer', interUnitTransferSchema);
