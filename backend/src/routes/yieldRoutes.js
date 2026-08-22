const express = require('express');
const { getYield, getVariance } = require('../controllers/yieldController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getYield);
router.get('/variance', requireAuth, getVariance);

module.exports = router;
