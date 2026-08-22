const express = require('express');
const { createTransfer, listTransfers } = require('../controllers/transferController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

// CLARIFICATION_REQUIRED §48.3: exact authorized roles for initiating transfers.
// DUMMY DEFAULT: operator/supervisor/manager all allowed for now.
router.post('/', requireAuth, requireRole('OPERATOR', 'SUPERVISOR', 'MANAGER'), createTransfer);
router.get('/', requireAuth, listTransfers);

module.exports = router;
