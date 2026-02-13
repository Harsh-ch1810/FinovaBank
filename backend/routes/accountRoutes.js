const express = require('express');
const { getAccountInfo, getBalance, updateBalance, getStatement } = require('../controllers/accountController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/info', protect, getAccountInfo);
router.get('/balance', protect, getBalance);
router.get('/statement', protect, getStatement);
router.put('/update-balance', protect, authorize('admin'), updateBalance);

module.exports = router;