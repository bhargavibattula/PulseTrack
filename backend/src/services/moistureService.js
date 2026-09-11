/**
 * Moisture calculation engine for Toor Dal Manufacturing.
 *
 * Standard moisture base = 10%.
 * Formula:
 *   deduction    = rawWeight × max(0, (moisture% − 10) / 100)
 *   adjustedQty  = rawWeight − deduction
 *
 * If moisture ≤ 10%, no deduction is applied (adjusted = raw).
 */

const STANDARD_MOISTURE_BASE = 10;

/**
 * Core calculation shared by both I/P and O/P paths.
 * Returns { grossWeightKg, moisturePct, moistureDeductionKg, adjustedNetWeightKg }.
 */
function _computeDeduction(rawWeightKg, actualMoisturePct, basePct = STANDARD_MOISTURE_BASE) {
  if (actualMoisturePct == null || isNaN(actualMoisturePct)) {
    return {
      grossWeightKg: rawWeightKg,
      moisturePct: null,
      moistureDeductionKg: 0,
      adjustedNetWeightKg: rawWeightKg
    };
  }

  // If moisture is at or below the standard, no deduction
  if (actualMoisturePct <= basePct) {
    return {
      grossWeightKg: rawWeightKg,
      moisturePct: actualMoisturePct,
      moistureDeductionKg: 0,
      adjustedNetWeightKg: rawWeightKg
    };
  }

  const moisturePoints = actualMoisturePct - basePct;
  const moistureDeductionKg = Math.round((rawWeightKg * (moisturePoints / 100)) * 100) / 100;
  const adjustedNetWeightKg = Math.round((rawWeightKg - moistureDeductionKg) * 100) / 100;

  return {
    grossWeightKg: rawWeightKg,
    moisturePct: actualMoisturePct,
    moistureDeductionKg,
    adjustedNetWeightKg
  };
}

/**
 * Calculate moisture-adjusted quantity (simple scalar return for backward compat).
 * Used by intake, production transfer creation, etc.
 */
function calculateMoistureAdjustedQuantity(quantityKg, actualMoisturePct) {
  const result = _computeDeduction(quantityKg, actualMoisturePct);
  return result.adjustedNetWeightKg;
}

/**
 * Full I/P (Input) moisture calculation.
 * Example: 30 tons @ 13% → deduction = 30 × 3% = 0.9 tons → adjusted = 29.1 tons
 */
function calculateInputMoistureDeduction({ rawWeightKg, actualMoisturePct, targetMoisturePct }) {
  return _computeDeduction(rawWeightKg, actualMoisturePct, targetMoisturePct || STANDARD_MOISTURE_BASE);
}

/**
 * Full O/P (Output) moisture calculation.
 * Example: 30 tons @ 12% → deduction = 30 × 2% = 0.6 tons → adjusted = 29.4 tons
 */
function calculateOutputMoistureDeduction({ rawWeightKg, actualMoisturePct, targetMoisturePct }) {
  return _computeDeduction(rawWeightKg, actualMoisturePct, targetMoisturePct || STANDARD_MOISTURE_BASE);
}

/**
 * Legacy wrapper kept for backward compatibility with existing intake controller.
 */
function computeMoistureDeduction({ rawWeightKg, actualMoisturePct, targetMoisturePct = 10 }) {
  return _computeDeduction(rawWeightKg, actualMoisturePct, targetMoisturePct);
}

module.exports = {
  STANDARD_MOISTURE_BASE,
  calculateMoistureAdjustedQuantity,
  calculateInputMoistureDeduction,
  calculateOutputMoistureDeduction,
  computeMoistureDeduction
};
