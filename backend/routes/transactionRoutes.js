// backend/routes/transactionRoutes.js
const express = require('express');
const {
  transfer,
  getHistory,
  getTransaction,
  verifyReceiverAccount,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ==================== PROTECTED ROUTES (Require Authentication) ====================

// Verify receiver account before transfer
router.post('/verify-account', protect, verifyReceiverAccount);

// Send money to another account
router.post('/transfer', protect, transfer);

// Get transaction history
router.get('/history', protect, getHistory);

// Get single transaction details
router.get('/:id', protect, getTransaction);

module.exports = router;