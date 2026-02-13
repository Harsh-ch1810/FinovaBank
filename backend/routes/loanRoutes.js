const express = require('express');
const { applyLoan, getMyLoans, getLoanDetails, makeLoanPayment } = require('../controllers/loanController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/apply', protect, applyLoan);
router.get('/myloans', protect, getMyLoans);
router.get('/:id', protect, getLoanDetails);
router.post('/:id/payment', protect, makeLoanPayment);

module.exports = router;