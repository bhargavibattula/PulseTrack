const express = require('express');
const { createLabTest, listLabTests } = require('../controllers/labController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.post('/', requireAuth, requireRole('SUPERVISOR', 'OPERATOR'), createLabTest);
router.get('/', requireAuth, requireRole('SUPERVISOR', 'OPERATOR'), listLabTests);

module.exports = router;
