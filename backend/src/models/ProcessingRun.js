const mongoose = require('mongoose');

const processingRunSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    stage: { type: String, enum: ['FIRST_PASS', 'SECOND_PASS'], required: true },
    sourceSilo: { type: mongoose.Schema.Types.ObjectId, ref: 'Silo', required: true },
    destinationSilo: { type: mongoose.Schema.Types.ObjectId, ref: 'Silo', default: null },
    inputQuantityKg: { type: Number, required: true, min: 0 },
    outputQuantityKg: { type: Number, required: true, min: 0 }, // Gota (stage 1) or Finished Dal (stage 2)
    date: { type: Date, default: Date.now },
    shift: { type: String, default: null },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProcessingRun', processingRunSchema);
