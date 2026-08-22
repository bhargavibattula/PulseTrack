const express = require('express');
const { intakeReport, inventoryReport, productionReport, dispatchReport } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/intake', requireAuth, requireRole('MANAGER'), intakeReport);
router.get('/inventory', requireAuth, requireRole('MANAGER'), inventoryReport);
router.get('/production', requireAuth, requireRole('MANAGER'), productionReport);
router.get('/dispatch', requireAuth, requireRole('MANAGER'), dispatchReport);

module.exports = router;
