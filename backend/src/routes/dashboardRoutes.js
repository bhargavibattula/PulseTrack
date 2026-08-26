const express = require('express');
const { managerDashboard, operatorDashboard } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/manager', requireAuth, requireRole('MANAGER'), managerDashboard);
router.get('/operator', requireAuth, operatorDashboard);

module.exports = router;
