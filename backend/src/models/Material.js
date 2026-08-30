const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'RAW', 'GOTA', 'FINISHED', 'BYPRODUCT'
    unitOfMeasure: { type: String, required: true, default: 'KG' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Material', materialSchema);
