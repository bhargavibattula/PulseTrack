/**
 * Yield calculations based on SRS 1.0.
 * Yield percentages determine output quantities.
 * Formula: output_qty = processing_qty * (yield_percent / 100)
 */
const { calculateMoistureAdjustedQuantity } = require('./moistureService');

/**
 * Validates that yield percentages add up to the required total (default 100%)
 */
function validateYieldTotal(yields, expectedTotal = 100) {
  const total = yields.reduce((sum, y) => sum + (y.yieldPercent || 0), 0);
  if (Math.abs(total - expectedTotal) > 0.01) { // Floating point precision check
    throw new Error(`Yield total must equal ${expectedTotal}%. Provided total is ${total}%.`);
  }
}

/**
 * Calculates exact output quantities for each yield destination based on physical processing quantity.
 * Preserves both physical and moisture-adjusted quantities.
 */
function calculateYieldOutputs(processingQtyKg, yields) {
  return yields.map(y => {
    if (y.yieldPercent < 0) {
      throw new Error('Yield percentages cannot be negative.');
    }

    const calculatedQty = processingQtyKg * (y.yieldPercent / 100);
    const roundedQty = Math.round(calculatedQty * 100) / 100;
    
    let adjustedQty = roundedQty;
    if (y.outputMoisture != null) {
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
  calculateYieldOutputs
};
