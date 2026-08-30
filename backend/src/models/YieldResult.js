const mongoose = require('mongoose');

const yieldResultSchema = new mongoose.Schema(
  {
    productionTransfer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ProductionTransfer', 
      required: true,
      unique: true // One yield result per production transfer
    },
    totalYieldPercent: { type: Number, required: true, default: 100 },
    status: { type: String, enum: ['ACCEPTED', 'REVERSED'], default: 'ACCEPTED' },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enteredAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('YieldResult', yieldResultSchema);
