const mongoose = require('mongoose');

const byproductSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    category: {
      type: String,
      enum: ['HUSK', 'POWDER', 'BROKEN'],
      required: true,
    },
    weightKg: { type: Number, required: true, min: 0 },
    bagCount: { type: Number, required: true, min: 0 },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

byproductSchema.index({ unit: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Byproduct', byproductSchema);
