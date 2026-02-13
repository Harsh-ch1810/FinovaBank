const express = require('express');
const { transfer, getHistory, getTransaction } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/transfer', protect, transfer);
router.get('/history', protect, getHistory);
router.get('/:id', protect, getTransaction);

module.exports = router;
