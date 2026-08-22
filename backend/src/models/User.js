const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['MANAGER', 'SUPERVISOR', 'OPERATOR'],
      required: true,
    },
    // Required for SUPERVISOR/OPERATOR, null for MANAGER (org-wide) — SRS §4
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },
    isActive: { type: Boolean, default: true },
    refreshTokenVersion: { type: Number, default: 0 }, // bump to invalidate all refresh tokens (logout-all)
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
