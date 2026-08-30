const { getCurrentStock, recordStockAdjustment } = require('../services/stockEngine');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

exports.getLocationStock = async (req, res, next) => {
  try {
    const { locationId, materialId } = req.params;
    
    const stockQty = await getCurrentStock(locationId, materialId);

    return ok(res, { locationId, materialId, stockQty });
  } catch (error) {
    next(error);
  }
};

exports.createAdjustment = async (req, res, next) => {
  try {
    const { locationId, materialId, direction, quantity, reason } = req.body;

    if (!reason || reason.trim() === '') {
      throw Errors.validation('Reason is mandatory for explicit stock adjustments');
    }

    const adjustment = await recordStockAdjustment({
      location: locationId,
      material: materialId,
      direction,
      quantity,
      reason,
      createdBy: req.user.id
    });

    return created(res, adjustment);
  } catch (error) {
    next(error);
  }
};

exports.getLedger = async (req, res, next) => {
  try {
    const StockTransaction = require('../models/StockTransaction');
    const unitId = req.user.unit || req.query.unitId;
    const query = {};
    if (unitId) query.unit = unitId;
    if (req.query.locationId) query.location = req.query.locationId;
    if (req.query.materialId) query.material = req.query.materialId;
    if (req.query.transactionType) query.transactionType = req.query.transactionType;

    const transactions = await StockTransaction.find(query)
      .populate('location material createdBy unit')
      .sort({ created_at: -1 })
      .limit(req.query.limit ? parseInt(req.query.limit) : 50)
      .lean();

    return ok(res, transactions);
  } catch (error) {
    next(error);
  }
};

