const express = require('express');
const { recordByproduct, getSummary } = require('../controllers/byproductController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', getSummary);
router.post('/', requireRole('OPERATOR', 'SUPERVISOR'), recordByproduct);

module.exports = router;
