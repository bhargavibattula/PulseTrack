const mongoose = require('mongoose');

// SRS §7, §38: every calculated field is frozen at creation time so that a later
// change to TARGET_BASE_MOISTURE never retroactively changes a past record (SRS §39).
const intakeSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    date: { type: Date, required: true, default: Date.now },
    vehicleNumber: { type: String, required: true },
    supplierReference: { type: String, default: null },
    grossWeightKg: { type: Number, required: true, min: 0 },
    moisturePct: { type: Number, required: true, min: 0, max: 100 },
    targetMoisturePctUsed: { type: Number, required: true }, // snapshot, SRS §38
    moistureDeductionKg: { type: Number, required: true }, // DUMMY formula, see services/moistureService.js
    adjustedNetWeightKg: { type: Number, required: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

intakeSchema.index({ unit: 1, date: 1 });

module.exports = mongoose.model('Intake', intakeSchema);
