const express = require('express');
const { createDispatch, listDispatch } = require('../controllers/dispatchController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.post('/', requireAuth, requireRole('OPERATOR', 'SUPERVISOR', 'MANAGER'), createDispatch);
router.get('/', requireAuth, listDispatch);

module.exports = router;
