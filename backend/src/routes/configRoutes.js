const express = require('express');
const { getConfig, updateConfig } = require('../controllers/configController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/:key', requireAuth, getConfig);
router.post('/:key', requireAuth, requireRole('SUPERVISOR'), updateConfig);

module.exports = router;
