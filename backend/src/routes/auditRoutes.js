const express = require('express');
const { listAuditLogs } = require('../controllers/auditController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/', requireAuth, requireRole('MANAGER'), listAuditLogs);

module.exports = router;
