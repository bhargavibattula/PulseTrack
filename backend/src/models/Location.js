const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'SILO', 'YARD'
    capacityKg: { type: Number, default: null }, // Null if no capacity
    isActive: { type: Boolean, default: true },
    lastActivityAt: { type: Date, default: null }, // Used to calculate idle time dynamically
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Unique code per unit
locationSchema.index({ unit: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);
