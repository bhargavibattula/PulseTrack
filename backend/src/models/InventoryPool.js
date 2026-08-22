const mongoose = require('mongoose');

// Continuous-blended-flow running balance (SRS §2.1, §21).
// CLARIFICATION_REQUIRED §48.6: pool keyed by Unit+Material vs Unit+Silo+Material.
// Modeled here as Unit + poolType (+ optional silo) so either answer fits without migration.
const inventoryPoolSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    silo: { type: mongoose.Schema.Types.ObjectId, ref: 'Silo', default: null },
    poolType: {
      type: String,
      enum: ['RAW', 'DRYING', 'GOTA', 'FINISHED'], // categories per SRS §21 example; final list TBD with client
      required: true,
    },
    quantityKg: { type: Number, default: 0, min: 0 }, // DB-level floor; service layer also enforces (SRS §22)
  },
  { timestamps: true }
);

inventoryPoolSchema.index({ unit: 1, poolType: 1, silo: 1 }, { unique: true });

module.exports = mongoose.model('InventoryPool', inventoryPoolSchema);
