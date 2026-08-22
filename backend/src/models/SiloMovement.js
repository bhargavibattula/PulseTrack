const mongoose = require('mongoose');

const siloMovementSchema = new mongoose.Schema(
  {
    fromSilo: { type: mongoose.Schema.Types.ObjectId, ref: 'Silo', default: null },
    toSilo: { type: mongoose.Schema.Types.ObjectId, ref: 'Silo', default: null },
    materialType: { type: String, required: true },
    quantityKg: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    shift: { type: String, default: null }, // SRS §48.5: shift structure TBD
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiloMovement', siloMovementSchema);
