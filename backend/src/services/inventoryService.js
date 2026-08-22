const InventoryPool = require('../models/InventoryPool');
const { Errors } = require('../utils/errors');

// Every inventory-mutating operation goes through these two functions so the
// "never negative" invariant (SRS §22) and locking behaviour (SRS §44) live in
// exactly one place.

async function creditPool({ unitId, poolType, siloId = null, quantityKg }, session) {
  const filter = { unit: unitId, poolType, silo: siloId };
  const pool = await InventoryPool.findOneAndUpdate(
    filter,
    { $inc: { quantityKg } },
    { new: true, upsert: true, session }
  );
  return pool;
}

async function debitPool({ unitId, poolType, siloId = null, quantityKg }, session) {
  const filter = { unit: unitId, poolType, silo: siloId };
  // Row-level lock + atomic check-then-debit in one query (avoids the classic
  // check-then-act race described in SRS §44): only decrement if the balance
  // is sufficient; otherwise no document matches and we know to reject.
  const pool = await InventoryPool.findOneAndUpdate(
    { ...filter, quantityKg: { $gte: quantityKg } },
    { $inc: { quantityKg: -quantityKg } },
    { new: true, session }
  );

  if (!pool) {
    const existing = await InventoryPool.findOne(filter, null, { session });
    throw Errors.insufficientInventory(existing?.quantityKg ?? 0, quantityKg);
  }

  return pool;
}

module.exports = { creditPool, debitPool };
