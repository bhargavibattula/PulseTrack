const express = require('express');
const { getInventory, getConsolidatedInventory } = require('../controllers/inventoryController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/', requireAuth, getInventory);
router.get('/consolidated', requireAuth, requireRole('MANAGER'), getConsolidatedInventory);

module.exports = router;
