const InventoryPool = require('../models/InventoryPool');
const { ok } = require('../utils/response');

async function getInventory(req, res, next) {
  try {
    const filter = req.user.role === 'MANAGER' ? {} : { unit: req.user.unit };
    if (req.query.unit_id && req.user.role === 'MANAGER') filter.unit = req.query.unit_id;
    const pools = await InventoryPool.find(filter).populate('unit silo');
    return ok(res, pools);
  } catch (err) {
    next(err);
  }
}

async function getConsolidatedInventory(req, res, next) {
  try {
    const pools = await InventoryPool.aggregate([
      { $group: { _id: { unit: '$unit', poolType: '$poolType' }, total: { $sum: '$quantityKg' } } },
    ]);
    return ok(res, pools);
  } catch (err) {
    next(err);
  }
}

module.exports = { getInventory, getConsolidatedInventory };
