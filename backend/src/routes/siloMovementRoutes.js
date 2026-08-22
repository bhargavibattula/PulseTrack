const express = require('express');
const { recordMovement } = require('../controllers/siloController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.post('/', requireAuth, requireRole('OPERATOR', 'SUPERVISOR', 'MANAGER'), recordMovement);

module.exports = router;
