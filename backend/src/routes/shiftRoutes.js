const express = require('express');
const { createShift, listShifts, updateShift } = require('../controllers/shiftController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.post('/', requireAuth, requireRole('OPERATOR', 'SUPERVISOR', 'MANAGER'), createShift);
router.get('/', requireAuth, listShifts);
router.patch('/:id', requireAuth, requireRole('OPERATOR', 'SUPERVISOR', 'MANAGER'), updateShift);

module.exports = router;
