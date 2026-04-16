// backend/routes/index.js - COMPLETE FIXED VERSION WITH NEW FEATURES
const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ==================== AUTH ROUTES ====================
const authController = require('../controllers/authController');

router.post('/api/auth/register', authController.register);
router.post('/api/auth/login', authController.login);
router.post('/api/auth/logout', protect, authController.logout);
router.get('/api/auth/me', protect, authController.getCurrentUser);
router.get('/api/auth/profile', protect, authController.getCurrentUser);
router.post('/api/auth/verify-aadhaar', authController.verifyAadhaar);

// ==================== FORGOT PASSWORD ROUTES ====================
router.post('/api/auth/forgot-password/security-question', authController.getSecurityQuestion);
router.post('/api/auth/forgot-password/reset', authController.resetPasswordWithAnswer);

// ==================== PROFILE ROUTES ====================
const profileController = require('../controllers/profileController');

router.get('/api/profile', protect, profileController.getProfile);
router.put('/api/profile', protect, profileController.updateProfile);
router.post('/api/profile/upload-picture', protect, profileController.uploadProfilePicture);
router.post('/api/profile/verify-aadhaar', protect, profileController.initiateAadhaarVerification);
router.post('/api/profile/verify-aadhaar-otp', protect, profileController.verifyAadhaarOTP);
router.post('/api/profile/change-password', protect, profileController.changePassword);
router.post('/api/profile/update-secondary-email', protect, profileController.updateSecondaryEmail);
router.get('/api/profile/completion-status', protect, profileController.getProfileCompletionStatus);

// ==================== ACCOUNT ROUTES ====================
const accountController = require('../controllers/accountController');

router.get('/api/account/info', protect, accountController.getAccountInfo);
router.post('/api/account/upgrade', protect, accountController.upgradeAccount);

// ==================== TRANSACTION ROUTES ====================
const transactionController = require('../controllers/transactionController');

router.post('/api/transaction/send-money', protect, transactionController.sendMoney);
router.get('/api/transaction/history', protect, transactionController.getHistory);
router.get('/api/transaction/:reference', protect, transactionController.getDetails);

// ==================== BENEFICIARY ROUTES ====================
const beneficiaryController = require('../controllers/beneficiaryController');

router.post('/api/beneficiary/add', protect, beneficiaryController.addBeneficiary);
router.post('/api/beneficiary/:id/verify-otp', protect, beneficiaryController.verifyBeneficiaryOTP);
router.get('/api/beneficiary/list', protect, beneficiaryController.getBeneficiaries);
router.get('/api/beneficiary/verified', protect, beneficiaryController.getVerifiedBeneficiaries);
router.delete('/api/beneficiary/:id', protect, beneficiaryController.deleteBeneficiary);
router.put('/api/beneficiary/:id', protect, beneficiaryController.updateBeneficiary);
router.get('/api/beneficiary/:id', protect, beneficiaryController.getBeneficiaryDetails);
router.post('/api/beneficiary/:id/resend-otp', protect, beneficiaryController.resendVerificationOTP);

// ==================== LOAN ROUTES ====================
const loanController = require('../controllers/loanController');

// User routes
router.post('/api/loan/apply', protect, loanController.applyLoan);
router.get('/api/loan/my-loans', protect, loanController.getUserLoans);
router.get('/api/loan/:id', protect, loanController.getLoanDetails);
router.post('/api/loan/calculate-emi', loanController.calculateEMI);

// Admin routes
router.post('/api/loan/:id/approve', protect, authorize('admin'), loanController.approveLoan);
router.post('/api/loan/:id/reject', protect, authorize('admin'), loanController.rejectLoan);

// ==================== SESSION ROUTES ====================
const sessionController = require('../controllers/sessionController');

router.get('/api/session/check', protect, sessionController.checkSession);
router.get('/api/session/info', protect, sessionController.getSessionInfo);
router.post('/api/session/extend', protect, sessionController.extendSession);
router.get('/api/session/active-sessions', protect, authorize('admin'), sessionController.getActiveSessions);
router.post('/api/session/logout-all-devices', protect, sessionController.logoutAllDevices);
router.post('/api/session/account-lock-status', sessionController.getAccountLockStatus);
router.post('/api/session/:userId/unlock-account', protect, authorize('admin'), sessionController.unlockAccount);

// ==================== NEW FEATURES - QUICK TRANSFER ROUTES ====================
const quickTransferController = require('../controllers/quickTransferController');

router.post('/api/quick-transfer', protect, quickTransferController.createQuickTransfer);
router.get('/api/quick-transfer/history', protect, quickTransferController.getQuickTransferHistory);
router.get('/api/quick-transfer/beneficiaries', protect, quickTransferController.getSavedBeneficiaries);
router.post('/api/quick-transfer/verify-beneficiary', protect, quickTransferController.verifyBeneficiary);

// ==================== NEW FEATURES - FINOVA CASH ROUTES ====================
const finanovaCashController = require('../controllers/finanovaCashController');

router.post('/api/finova-cash/withdrawal', protect, finanovaCashController.withdrawCash);
router.post('/api/finova-cash/deposit', protect, finanovaCashController.depositCash);
router.get('/api/finova-cash/transactions', protect, finanovaCashController.getCashTransactions);
router.get('/api/finova-cash/transactions/:reference', protect, finanovaCashController.getTransactionDetails);

// ==================== NEW FEATURES - INSURANCE ROUTES ====================
const insuranceController = require('../controllers/insuranceController');

router.post('/api/insurance/buy', protect, insuranceController.buyInsurance);
router.get('/api/insurance/my-policies', protect, insuranceController.getMyPolicies);
router.get('/api/insurance/policy/:policyNumber', protect, insuranceController.getPolicyDetails);
router.post('/api/insurance/file-claim', protect, insuranceController.fileClaim);
router.post('/api/insurance/pay-premium', protect, insuranceController.payPremium);
router.get('/api/insurance/plans', insuranceController.getInsurancePlans);
router.get('/api/insurance/plans/:type', insuranceController.getInsurancePlans);

// ==================== ADMIN ROUTES ====================
const adminController = require('../controllers/adminController');

// Apply admin auth to all admin routes
router.use('/api/admin', protect, authorize('admin'));

// User management
router.get('/api/admin/users', async (req, res) => {
  try {
    const User = require('../models/User');
    const { skip = 0, limit = 20 } = req.query;

    const users = await User.find()
      .select('-password -passwordHistory')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
});

// Transaction monitoring
router.get('/api/admin/transactions', async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const { skip = 0, limit = 20, status } = req.query;

    let query = {};
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
});

module.exports = router;