const express = require('express');
const { listUnits, createUnit } = require('../controllers/unitController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/', requireAuth, listUnits);
router.post('/', requireAuth, requireRole('SUPERVISOR'), createUnit);

module.exports = router;
