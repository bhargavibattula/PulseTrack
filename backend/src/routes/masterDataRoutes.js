const express = require('express');
const Unit = require('../models/Unit');
const Location = require('../models/Location');
const Material = require('../models/Material');
const Shift = require('../models/Shift');
const Process = require('../models/Process');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');
const { ok, created } = require('../utils/response');

const router = express.Router();
router.use(requireAuth);

// Get all active master data for dropdowns / selections
router.get('/all', async (req, res, next) => {
  try {
    const unitId = req.user.unit;
    const unitQuery = unitId ? { unit: unitId, isActive: true } : { isActive: true };

    const [units, locations, materials, shifts, processes] = await Promise.all([
      Unit.find({ isActive: true }).sort({ name: 1 }).lean(),
      Location.find(unitQuery).sort({ name: 1 }).lean(),
      Material.find({ isActive: true }).sort({ name: 1 }).lean(),
      Shift.find({ isActive: true }).sort({ name: 1 }).lean(),
      Process.find(unitQuery).sort({ name: 1 }).lean()
    ]);

    return ok(res, {
      units,
      locations,
      materials,
      shifts,
      processes
    });
  } catch (error) {
    next(error);
  }
});

// Locations CRUD
router.get('/locations', async (req, res, next) => {
  try {
    const unitId = req.user.unit || req.query.unitId;
    const filter = unitId ? { unit: unitId, isActive: true } : { isActive: true };
    const locations = await Location.find(filter).populate('unit').sort({ name: 1 }).lean();
    return ok(res, locations);
  } catch (error) {
    next(error);
  }
});

// Materials CRUD
router.get('/materials', async (req, res, next) => {
  try {
    const materials = await Material.find({ isActive: true }).sort({ name: 1 }).lean();
    return ok(res, materials);
  } catch (error) {
    next(error);
  }
});

// Processes CRUD
router.get('/processes', async (req, res, next) => {
  try {
    const unitId = req.user.unit || req.query.unitId;
    const filter = unitId ? { unit: unitId, isActive: true } : { isActive: true };
    const processes = await Process.find(filter).sort({ name: 1 }).lean();
    return ok(res, processes);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
