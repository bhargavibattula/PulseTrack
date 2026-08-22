const express = require('express');
const { createProcessingRun, listProcessingRuns } = require('../controllers/processingController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.post('/', requireAuth, requireRole('OPERATOR', 'SUPERVISOR', 'MANAGER'), createProcessingRun);
router.get('/', requireAuth, listProcessingRuns);

module.exports = router;
