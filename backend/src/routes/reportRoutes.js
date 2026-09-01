const express = require('express');
const { intakeReport, inventoryReport, productionReport, dispatchReport } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/intake', requireAuth, requireRole('SUPERVISOR'), intakeReport);
router.get('/inventory', requireAuth, requireRole('SUPERVISOR'), inventoryReport);
router.get('/production', requireAuth, requireRole('SUPERVISOR'), productionReport);
router.get('/dispatch', requireAuth, requireRole('SUPERVISOR'), dispatchReport);

module.exports = router;
