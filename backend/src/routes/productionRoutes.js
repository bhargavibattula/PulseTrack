const express = require('express');
const { 
  createTransfer, 
  submitYield, 
  getPendingLab, 
  listTransfers, 
  getTransferById 
} = require('../controllers/productionController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');

const router = express.Router();

router.use(requireAuth);

router.get('/pending-lab', requireRole('SUPERVISOR', 'OPERATOR'), getPendingLab);
router.get('/', requireRole('SUPERVISOR', 'OPERATOR'), listTransfers);
router.get('/:id', requireRole('SUPERVISOR', 'OPERATOR'), getTransferById);
router.post('/transfer', requireRole('SUPERVISOR', 'OPERATOR'), createTransfer);
router.post('/yield', requireRole('SUPERVISOR', 'OPERATOR'), submitYield);

module.exports = router;
