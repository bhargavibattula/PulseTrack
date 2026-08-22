const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    // CLARIFICATION_REQUIRED §48.5: number/timing of shifts. Free-text label for now.
    shiftLabel: { type: String, default: 'SHIFT_1' },
    date: { type: Date, required: true, default: Date.now },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startingQuantityKg: { type: Number, default: null },
    movementQuantityKg: { type: Number, default: null },
    processingQuantityKg: { type: Number, default: null },
    notes: { type: String, default: null },
    status: { type: String, enum: ['SUBMITTED', 'LATE', 'PENDING'], default: 'SUBMITTED' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shift', shiftSchema);
