const express = require('express');
const { listSilos, createSilo, getSilo, updateSiloStatus, recordMovement } = require('../controllers/siloController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/', requireAuth, listSilos);
router.post('/', requireAuth, requireRole('SUPERVISOR'), createSilo);
router.get('/:id', requireAuth, getSilo);
router.patch('/:id/status', requireAuth, requireRole('OPERATOR', 'SUPERVISOR'), updateSiloStatus);
router.post('/movement', requireAuth, requireRole('OPERATOR', 'SUPERVISOR'), recordMovement);

module.exports = router;
