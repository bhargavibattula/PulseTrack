const express = require('express');
const { listUsers, createUser, updateUser } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/', requireAuth, requireRole('SUPERVISOR', 'MANAGER'), listUsers);
router.post('/', requireAuth, requireRole('SUPERVISOR', 'MANAGER'), createUser);
router.patch('/:id', requireAuth, requireRole('SUPERVISOR', 'MANAGER'), updateUser);

module.exports = router;
