const express = require('express');
const { listSilos, createSilo, getSilo, updateSiloStatus, recordMovement } = require('../controllers/siloController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/', requireAuth, listSilos);
router.post('/', requireAuth, requireRole('MANAGER'), createSilo);
router.get('/:id', requireAuth, getSilo);
router.patch('/:id/status', requireAuth, requireRole('OPERATOR', 'SUPERVISOR', 'MANAGER'), updateSiloStatus);

module.exports = router;
