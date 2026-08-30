const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema(
  {
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    direction: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
