const mongoose = require('mongoose');

// Versioned, append-only configuration store (SRS §38-§39).
// The "current" value for a key is the row with the latest effectiveFrom.
// Never update a row in place — always insert a new version.
const configurationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // e.g. 'TARGET_BASE_MOISTURE'
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    scope: { type: String, enum: ['GLOBAL', 'UNIT'], default: 'GLOBAL' }, // CLARIFICATION_REQUIRED §48.2
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },
    effectiveFrom: { type: Date, default: Date.now },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

configurationSchema.index({ key: 1, effectiveFrom: -1 });

module.exports = mongoose.model('Configuration', configurationSchema);
