const mongoose = require('mongoose');

const SILO_STATUSES = ['EMPTY', 'FILLING', 'FULL_SITTING', 'EMPTYING'];

const siloSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    name: { type: String, required: true },
    status: { type: String, enum: SILO_STATUSES, default: 'EMPTY' },
    // CLARIFICATION_REQUIRED (SRS §48.4): capacity enforcement not yet confirmed with client.
    // Field is present so enforcement can be turned on later without a schema change.
    capacityKg: { type: Number, default: null },
    currentQuantityKg: { type: Number, default: 0, min: 0 },
    materialType: { type: String, default: null },
  },
  { timestamps: true }
);

siloSchema.index({ unit: 1, status: 1 });

module.exports = mongoose.model('Silo', siloSchema);
module.exports.SILO_STATUSES = SILO_STATUSES;
