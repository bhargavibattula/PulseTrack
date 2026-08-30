const express = require('express');
const { getLocationStock, createAdjustment, getLedger } = require('../controllers/stockController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.use(requireAuth);

router.get('/ledger', requireRole('SUPERVISOR', 'OPERATOR'), getLedger);
router.get('/location/:locationId/material/:materialId', requireRole('SUPERVISOR', 'OPERATOR'), getLocationStock);
router.post('/adjustment', requireRole('SUPERVISOR', 'OPERATOR'), createAdjustment);

module.exports = router;
