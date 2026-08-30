const mongoose = require('mongoose');

const processSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

processSchema.index({ unit: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Process', processSchema);
