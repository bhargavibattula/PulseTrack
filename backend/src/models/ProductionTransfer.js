const mongoose = require('mongoose');

const productionTransferSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
    process: { type: mongoose.Schema.Types.ObjectId, ref: 'Process', required: true },
    sourceLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    destinationLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    processingQty: { type: Number, required: true, min: 0 },           // Physical / gross weight
    inputMoisture: { type: Number, min: 0, max: 100, default: null },   // I/P moisture %
    adjustedInputQty: { type: Number, default: null },                  // Moisture-adjusted I/P weight
    outputMoisture: { type: Number, min: 0, max: 100, default: null },  // O/P moisture %
    adjustedOutputQty: { type: Number, default: null },                 // Moisture-adjusted O/P weight
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
