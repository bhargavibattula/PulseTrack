const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    truckNumber: { type: String, default: null }, // CLARIFICATION_REQUIRED §48.7: mandatory?
    date: { type: Date, default: Date.now },
    product: { type: String, required: true, default: 'FINISHED_TOOR_DAL' },
    quantityKg: { type: Number, required: true, min: 0 },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destinationReference: { type: String, default: null },
  },
  { timestamps: true }
);

dispatchSchema.index({ unit: 1, date: 1 });

module.exports = mongoose.model('Dispatch', dispatchSchema);
