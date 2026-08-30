const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    direction: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    transactionType: { 
      type: String, 
      enum: ['PRODUCTION', 'YIELD', 'OPERATOR_MOVEMENT', 'ADJUSTMENT', 'REVERSAL'],
      required: true 
    },
    referenceType: { type: String, required: true }, // e.g., 'ProductionTransfer', 'YieldOutput'
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Indexes for fast ledger lookups and balance calculations
stockTransactionSchema.index({ location: 1, material: 1 });
stockTransactionSchema.index({ unit: 1, transactionType: 1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
