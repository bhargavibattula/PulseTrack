/**
 * Yield calculations based on client requirements.
 *
 * Lab enters byproduct percentages (e.g. 10% Split, 3% Husk).
 * Main output % = 100 − sum(byproduct %).
 * Each output qty = processingQty × (yieldPercent / 100).
 *
 * Optionally, output moisture can be applied per-stream.
 */
const { calculateMoistureAdjustedQuantity } = require('./moistureService');

/**
 * Validates that yield percentages add up to the required total (default 100%).
 */
function validateYieldTotal(yields, expectedTotal = 100) {
  const total = yields.reduce((sum, y) => sum + (y.yieldPercent || 0), 0);
  if (Math.abs(total - expectedTotal) > 0.01) { // Floating point precision check
    throw new Error(`Yield total must equal ${expectedTotal}%. Provided total is ${total}%.`);
  }
}

/**
 * Auto-derives the main output stream percentage from byproduct entries.
 * Input: array of byproduct yields (e.g. [{yieldPercent: 10, ...}, {yieldPercent: 3, ...}])
 * Returns: the main stream yield percent (e.g. 87%).
 */
function deriveMainYieldPercent(byproductYields) {
  const byproductTotal = byproductYields.reduce((sum, y) => sum + (y.yieldPercent || 0), 0);
  if (byproductTotal > 100 || byproductTotal < 0) {
    throw new Error(`Byproduct yield total (${byproductTotal}%) exceeds 100% or is negative.`);
  }
  return Math.round((100 - byproductTotal) * 100) / 100;
}

/**
 * Calculates exact output quantities for each yield destination based on physical processing quantity.
 * Preserves both physical (calculatedQty) and moisture-adjusted (adjustedQty) quantities.
 *
 * @param {number} processingQtyKg - The raw/physical quantity being processed
 * @param {Array} yields - Array of yield outputs with yieldPercent, optional outputMoisture
 * @returns {Array} yields with calculatedQty and adjustedQty appended
 */
function calculateYieldOutputs(processingQtyKg, yields) {
  return yields.map(y => {
    if (y.yieldPercent < 0) {
      throw new Error('Yield percentages cannot be negative.');
    }

    const calculatedQty = processingQtyKg * (y.yieldPercent / 100);
    const roundedQty = Math.round(calculatedQty * 100) / 100;
    
    let adjustedQty = roundedQty;
    if (y.outputMoisture != null && y.outputMoisture > 10) {
      adjustedQty = calculateMoistureAdjustedQuantity(roundedQty, y.outputMoisture);
    }

    return {
      ...y,
      calculatedQty: roundedQty,
      adjustedQty
    };
  });
}

module.exports = {
  validateYieldTotal,
  deriveMainYieldPercent,
  calculateYieldOutputs
};
