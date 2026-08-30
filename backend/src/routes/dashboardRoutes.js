const express = require('express');
const { getSupervisorDashboard, getOperatorDashboard } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.use(requireAuth);
router.get('/supervisor', requireRole('SUPERVISOR'), getSupervisorDashboard);
router.get('/operator', requireRole('OPERATOR', 'SUPERVISOR'), getOperatorDashboard);

module.exports = router;
