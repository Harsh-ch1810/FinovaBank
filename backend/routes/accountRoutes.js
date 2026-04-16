// banking-app-backend/routes/accountRoutes.js - ENHANCED VERSION
const express = require('express');
const {
  // Existing endpoints
  getAccountInfo,
  getInfo,
  getTransactions,
  getAccountLimits,
  getAccountInfoForDashboard,
  upgradeAccount,
  // New hybrid account endpoints
  getHybridAccountDetails,
  checkHybridEligibility,
  calculateInterest,
  useOverdraft,
  getAccountSummary,
  deductMonthlyFee,
  downgradeAccount,
} = require('../controllers/accountController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ==================== EXISTING ROUTES (BACKWARD COMPATIBLE) ====================

// Get account info
router.get('/info', protect, getAccountInfo);

// Alternative endpoint for account info
router.get('/getInfo', protect, getInfo);

// Get account info for dashboard
router.get('/dashboard-info', protect, getAccountInfoForDashboard);

// Get account limits
router.get('/limits', protect, getAccountLimits);

// Get transaction history
router.get('/transactions', protect, getTransactions);

// Upgrade account type
router.post('/upgrade', protect, upgradeAccount);

// ==================== NEW HYBRID ACCOUNT ROUTES ====================

// Get account summary
router.get('/summary', protect, getAccountSummary);

// Get hybrid account details
router.get('/hybrid/details', protect, getHybridAccountDetails);

// Check eligibility for hybrid account
router.get('/hybrid/eligibility', protect, checkHybridEligibility);

// Calculate and credit interest
router.post('/hybrid/calculate-interest', protect, calculateInterest);

// Use overdraft facility
router.post('/hybrid/use-overdraft', protect, useOverdraft);

// Deduct monthly fee
router.post('/deduct-fee', protect, authorize('admin'), deductMonthlyFee);

// Downgrade account from hybrid
router.post('/downgrade', protect, downgradeAccount);

module.exports = router;