const mongoose = require('mongoose');

const productionTransferSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
    process: { type: mongoose.Schema.Types.ObjectId, ref: 'Process', required: true },
    sourceLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    processingQty: { type: Number, required: true, min: 0 },
    inputMoisture: { type: Number, min: 0, max: 100, default: null },
    adjustedInputQty: { type: Number, default: null },
    status: { 
      type: String, 
      enum: ['PENDING_LAB', 'COMPLETED', 'REVERSED'], 
      default: 'PENDING_LAB' 
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('ProductionTransfer', productionTransferSchema);
