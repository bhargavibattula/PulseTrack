/**
 * DUMMY BUSINESS LOGIC — placeholder only.
 *
 * SRS §9 / §48.1 explicitly leaves the exact moisture-deduction formula as
 * CLARIFICATION_REQUIRED. The rule below is NOT a business rule — it is a
 * simple, clearly-flagged stand-in so the rest of the pipeline (intake ->
 * inventory -> yield) can be built and tested end-to-end.
 *
 * Replace `computeMoistureDeduction` with the real client-approved formula
 * before this goes anywhere near production data. Nothing else in the app
 * needs to change when you do — every caller goes through this one function.
 */
function computeMoistureDeduction({ rawWeightKg, actualMoisturePct, targetMoisturePct }) {
  if (actualMoisturePct <= targetMoisturePct) {
    return { moistureDeductionKg: 0, adjustedNetWeightKg: rawWeightKg };
  }

  // --- DUMMY FORMULA (placeholder) ---
  // Naively deducts 1% of raw weight per 1 percentage-point of excess moisture.
  // This is almost certainly NOT the real mill formula. Flagged loudly on purpose.
  const excessPct = actualMoisturePct - targetMoisturePct;
  const moistureDeductionKg = Math.round(rawWeightKg * (excessPct / 100) * 100) / 100;
  const adjustedNetWeightKg = Math.round((rawWeightKg - moistureDeductionKg) * 100) / 100;

  return { moistureDeductionKg, adjustedNetWeightKg };
}

module.exports = { computeMoistureDeduction };
