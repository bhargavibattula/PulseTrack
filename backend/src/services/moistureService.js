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
    // SRS 6.3: Behavior below 10% is not yet defined. Block submission until configured.
    throw new Error('Moisture below 10% is not currently supported by business rules. Please configure this rule before proceeding.');
  }

  // Exact client formula: percentage-point deduction
  const moisturePoints = actualMoisturePct - 10;
  const deductionKg = quantityKg * (moisturePoints / 100);
  const adjustedQty = quantityKg - deductionKg;

  // Round to 2 decimal places for storage
  return Math.round(adjustedQty * 100) / 100;
}

module.exports = { calculateMoistureAdjustedQuantity };
