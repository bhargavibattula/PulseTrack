const mongoose = require('mongoose');
const StockTransaction = require('../models/StockTransaction');
const StockAdjustment = require('../models/StockAdjustment');
const Location = require('../models/Location');

/**
 * Validates if the location has sufficient stock of the specific material.
 */
const validateSufficientStock = async (locationId, materialId, requiredQuantity, session) => {
  const currentStock = await getCurrentStock(locationId, materialId, session);
  if (currentStock < requiredQuantity) {
    throw new Error(`Insufficient stock. Location has ${currentStock}, but ${requiredQuantity} is required.`);
  }
};

/**
 * Calculates current stock dynamically from the ledger.
 * formula: previous balance + inbound - outbound + adjustments = current balance
 */
const getCurrentStock = async (locationId, materialId, session) => {
  // 1. Calculate transactions (IN - OUT)
  const txResult = await StockTransaction.aggregate([
    { $match: { location: new mongoose.Types.ObjectId(locationId), material: new mongoose.Types.ObjectId(materialId) } },
    {
      $group: {
        _id: null,
        totalIn: { $sum: { $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0] } },
        totalOut: { $sum: { $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0] } }
      }
    }
  ]).session(session);

  const txIn = txResult[0]?.totalIn || 0;
  const txOut = txResult[0]?.totalOut || 0;

  // 2. Calculate explicit adjustments (IN - OUT)
  const adjResult = await StockAdjustment.aggregate([
    { $match: { location: new mongoose.Types.ObjectId(locationId), material: new mongoose.Types.ObjectId(materialId) } },
    {
      $group: {
        _id: null,
        totalIn: { $sum: { $cond: [{ $eq: ['$direction', 'IN'] }, '$quantity', 0] } },
        totalOut: { $sum: { $cond: [{ $eq: ['$direction', 'OUT'] }, '$quantity', 0] } }
      }
    }
  ]).session(session);

  const adjIn = adjResult[0]?.totalIn || 0;
  const adjOut = adjResult[0]?.totalOut || 0;

  return (txIn - txOut) + (adjIn - adjOut);
};

/**
 * Records an atomic stock movement. 
 * Expected payload: array of { unit, location, material, direction, quantity, transactionType, referenceType, referenceId, createdBy }
 */
const recordStockTransactions = async (transactions, existingSession) => {
  const session = existingSession || (await mongoose.startSession());
  const isInternal = !existingSession;
  if (isInternal) session.startTransaction();

  try {
    const createdTransactions = [];
    
    // Process each transaction to enforce validation sequentially
    for (const tx of transactions) {
      if (tx.direction === 'OUT') {
        await validateSufficientStock(tx.location, tx.material, tx.quantity, session);
      }
      
      const newTx = new StockTransaction(tx);
      await newTx.save({ session });
      createdTransactions.push(newTx);

      // Update location activity timestamp
      await Location.findByIdAndUpdate(
        tx.location,
        { lastActivityAt: new Date() },
        { session }
      );
    }

    if (isInternal) await session.commitTransaction();
    return createdTransactions;
  } catch (error) {
    if (isInternal) await session.abortTransaction();
    throw error;
  } finally {
    if (isInternal) session.endSession();
  }
};

/**
 * Records a direct explicit stock adjustment.
 */
const recordStockAdjustment = async (adjustmentData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (adjustmentData.direction === 'OUT') {
      await validateSufficientStock(adjustmentData.location, adjustmentData.material, adjustmentData.quantity, session);
    }

    const newAdj = new StockAdjustment(adjustmentData);
    await newAdj.save({ session });

    // Update location activity timestamp
    await Location.findByIdAndUpdate(
      adjustmentData.location,
      { lastActivityAt: new Date() },
      { session }
    );

    await session.commitTransaction();
    return newAdj;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  getCurrentStock,
  recordStockTransactions,
  recordStockAdjustment
};
