const express = require('express');
const { createTransfer, listTransfers } = require('../controllers/transferController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.post('/', requireAuth, requireRole('OPERATOR', 'SUPERVISOR'), createTransfer);
router.get('/', requireAuth, listTransfers);

module.exports = router;
