const express = require('express');
const { createLabTest, listLabTests } = require('../controllers/labController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.post('/', requireAuth, requireRole('MANAGER'), createLabTest);
router.get('/', requireAuth, requireRole('MANAGER'), listLabTests);

module.exports = router;
