const express = require('express');
const { createIntake, previewIntake, listIntake, getIntake } = require('../controllers/intakeController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.post('/preview', requireAuth, previewIntake);
router.post('/', requireAuth, requireRole('OPERATOR', 'SUPERVISOR'), createIntake);
router.get('/', requireAuth, listIntake);
router.get('/:id', requireAuth, getIntake);

module.exports = router;
