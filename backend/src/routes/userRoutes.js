const express = require('express');
const { listUsers, createUser, updateUser } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.get('/', requireAuth, requireRole('MANAGER'), listUsers);
router.post('/', requireAuth, requireRole('MANAGER'), createUser);
router.patch('/:id', requireAuth, requireRole('MANAGER'), updateUser);

module.exports = router;
