const mongoose = require('mongoose');

const byProductRecordSchema = new mongoose.Schema(
  {
    processingRun: { type: mongoose.Schema.Types.ObjectId, ref: 'ProcessingRun', default: null },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    category: { type: String, enum: ['HUSK', 'POWDER', 'BROKEN'], required: true }, // Bhusa / Chuni / Tukda
    weightKg: { type: Number, required: true, min: 0 },
    bagCount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    shift: { type: String, default: null },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ByProductRecord', byProductRecordSchema);
