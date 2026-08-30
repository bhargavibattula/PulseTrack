/**
 * Calculates moisture deductions based on the confirmed SRS 1.0 rule.
 * Standard moisture is fixed at 10%.
 * Formula: adjusted_qty = qty * (1 - (moisture - 10) / 100)
 */

function calculateMoistureAdjustedQuantity(quantityKg, actualMoisturePct) {
  if (actualMoisturePct == null || isNaN(actualMoisturePct)) {
    return quantityKg;
  }

  if (actualMoisturePct < 10) {
    throw new Error('Moisture below 10% is not currently supported by business rules. Please configure this rule before proceeding.');
  }

  const moisturePoints = actualMoisturePct - 10;
  const deductionKg = quantityKg * (moisturePoints / 100);
  const adjustedQty = quantityKg - deductionKg;

  return Math.round(adjustedQty * 100) / 100;
}

function computeMoistureDeduction({ rawWeightKg, actualMoisturePct, targetMoisturePct = 10 }) {
  const base = targetMoisturePct || 10;
  if (actualMoisturePct < base) {
    throw new Error(`Moisture below ${base}% is not supported.`);
  }
  const moisturePoints = actualMoisturePct - base;
  const moistureDeductionKg = Math.round((rawWeightKg * (moisturePoints / 100)) * 100) / 100;
  const adjustedNetWeightKg = Math.round((rawWeightKg - moistureDeductionKg) * 100) / 100;

  return {
    rawWeightKg,
    actualMoisturePct,
    moistureDeductionKg,
    adjustedNetWeightKg
  };
}

module.exports = { calculateMoistureAdjustedQuantity, computeMoistureDeduction };
