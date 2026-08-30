const mongoose = require('mongoose');

const yieldOutputSchema = new mongoose.Schema(
  {
    yieldResult: { type: mongoose.Schema.Types.ObjectId, ref: 'YieldResult', required: true },
    destinationLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    yieldPercent: { type: Number, required: true, min: 0 },
    calculatedQty: { type: Number, required: true, min: 0 },
    outputMoisture: { type: Number, min: 0, max: 100, default: null },
    adjustedQty: { type: Number, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('YieldOutput', yieldOutputSchema);
