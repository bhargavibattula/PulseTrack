const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },
    testDate: { type: Date, required: true, default: Date.now },
    sampleReference: { type: String, default: null },
    expectedRecoveryPct: { type: Number, required: true },
    notes: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabTest', labTestSchema);
