const mongoose = require('mongoose');

const shiftLogSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: false },
    shiftLabel: { type: String, required: true },
    date: { type: Date, default: Date.now },
    movementQuantityKg: { type: Number, default: 0 },
    processingQuantityKg: { type: Number, default: 0 },
    notes: { type: String, default: null },
    status: { type: String, enum: ['OPEN', 'COMPLETED'], default: 'COMPLETED' },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

shiftLogSchema.index({ unit: 1, date: -1 });

module.exports = mongoose.model('ShiftLog', shiftLogSchema);
