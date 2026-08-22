const express = require('express');
const { createByProduct, byProductSummary } = require('../controllers/byproductController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.post('/', requireAuth, requireRole('OPERATOR', 'SUPERVISOR', 'MANAGER'), createByProduct);
router.get('/summary', requireAuth, byProductSummary);

module.exports = router;
