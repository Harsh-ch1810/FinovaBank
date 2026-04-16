// banking-app-backend/routes/index.js
const express = require('express');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const accountRoutes = require('./accountRoutes');
const transactionRoutes = require('./transactionRoutes');
const beneficiaryRoutes = require('./beneficiaryRoutes');
const loanRoutes = require('./loanRoutes');
const sessionRoutes = require('./sessionRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

// Mount all routes
router.use('/api/auth', authRoutes);
router.use('/api/profile', profileRoutes);
router.use('/api/account', accountRoutes);
router.use('/api/transaction', transactionRoutes);
router.use('/api/beneficiary', beneficiaryRoutes);
router.use('/api/loan', loanRoutes);
router.use('/api/session', sessionRoutes);
router.use('/api/admin', adminRoutes);

module.exports = router;

// ==================== AUTH ROUTES ====================
// banking-app-backend/routes/authRoutes.js
const authController = require('../controllers/authController');
const { protect, rateLimitLogin, authorize } = require('../middleware/auth');

const authRouter = express.Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', rateLimitLogin, authController.login);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password/:token', authController.resetPassword);
authRouter.post('/logout', protect, authController.logout);
authRouter.post('/verify-aadhaar', authController.verifyAadhaarFormat);

module.exports = authRouter;

// ==================== PROFILE ROUTES ====================
// banking-app-backend/routes/profileRoutes.js
const profileController = require('../controllers/profileController');

const profileRouter = express.Router();

profileRouter.get('/', protect, profileController.getProfile);
profileRouter.put('/', protect, profileController.updateProfile);
profileRouter.post('/upload-picture', protect, profileController.uploadProfilePicture);
profileRouter.post('/verify-aadhaar', protect, profileController.initiateAadhaarVerification);
profileRouter.post('/verify-aadhaar-otp', protect, profileController.verifyAadhaarOTP);
profileRouter.post('/change-password', protect, profileController.changePassword);
profileRouter.post('/update-secondary-email', protect, profileController.updateSecondaryEmail);
profileRouter.get('/completion-status', protect, profileController.getProfileCompletionStatus);

module.exports = profileRouter;

// ==================== ACCOUNT ROUTES ====================
// banking-app-backend/routes/accountRoutes.js
const accountController = require('../controllers/accountController');

const accountRouter = express.Router();

accountRouter.get('/info', protect, accountController.getAccountInfo);
accountRouter.get('/statement', protect, accountController.getAccountStatement);
accountRouter.post('/upgrade', protect, accountController.upgradeAccount);
accountRouter.post('/downgrade', protect, accountController.downgradeAccount);
accountRouter.get('/transaction-limits', protect, accountController.getTransactionLimits);
accountRouter.get('/upgrade-eligibility', protect, accountController.getUpgradeEligibility);

module.exports = accountRouter;

// ==================== TRANSACTION ROUTES ====================
// banking-app-backend/routes/transactionRoutes.js
const transactionController = require('../controllers/transactionController');

const transactionRouter = express.Router();

transactionRouter.post('/initiate-transfer', protect, transactionController.initiateTransfer);
transactionRouter.post('/verify-transfer-otp', protect, transactionController.verifyTransferOTP);
transactionRouter.get('/history', protect, transactionController.getTransactionHistory);
transactionRouter.get('/:reference', protect, transactionController.getTransactionDetails);
transactionRouter.post('/:reference/cancel', protect, transactionController.cancelTransaction);
transactionRouter.get('/summary', protect, transactionController.getTransactionSummary);

module.exports = transactionRouter;

// ==================== BENEFICIARY ROUTES ====================
// banking-app-backend/routes/beneficiaryRoutes.js
const beneficiaryController = require('../controllers/beneficiaryController');

const beneficiaryRouter = express.Router();

beneficiaryRouter.post('/add', protect, beneficiaryController.addBeneficiary);
beneficiaryRouter.post('/:id/verify-otp', protect, beneficiaryController.verifyBeneficiaryOTP);
beneficiaryRouter.get('/list', protect, beneficiaryController.getBeneficiaries);
beneficiaryRouter.get('/verified', protect, beneficiaryController.getVerifiedBeneficiaries);
beneficiaryRouter.delete('/:id', protect, beneficiaryController.deleteBeneficiary);
beneficiaryRouter.put('/:id', protect, beneficiaryController.updateBeneficiary);
beneficiaryRouter.get('/:id', protect, beneficiaryController.getBeneficiaryDetails);
beneficiaryRouter.post('/:id/resend-otp', protect, beneficiaryController.resendVerificationOTP);

module.exports = beneficiaryRouter;

// ==================== LOAN ROUTES ====================
// banking-app-backend/routes/loanRoutes.js
const loanController = require('../controllers/loanController');

const loanRouter = express.Router();

// User routes
loanRouter.post('/apply', protect, loanController.applyLoan);
loanRouter.get('/my-loans', protect, loanController.getUserLoans);
loanRouter.get('/:id', protect, loanController.getLoanDetails);
loanRouter.get('/:id/emi-schedule', protect, loanController.getEMISchedule);
loanRouter.post('/:id/pay-emi', protect, loanController.payEMI);
loanRouter.post('/calculate-emi', loanController.calculateEMI);

// Admin routes
loanRouter.get('/admin/all-loans', protect, authorize('admin'), loanController.getAllLoans);
loanRouter.post('/:id/approve', protect, authorize('admin'), loanController.approveLoan);
loanRouter.post('/:id/reject', protect, authorize('admin'), loanController.rejectLoan);
loanRouter.post('/:id/disburse', protect, authorize('admin'), loanController.disburseLoan);

module.exports = loanRouter;

// ==================== SESSION ROUTES ====================
// banking-app-backend/routes/sessionRoutes.js
const sessionController = require('../controllers/sessionController');

const sessionRouter = express.Router();

sessionRouter.get('/check', protect, sessionController.checkSession);
sessionRouter.get('/info', protect, sessionController.getSessionInfo);
sessionRouter.post('/extend', protect, sessionController.extendSession);
sessionRouter.get('/active-sessions', protect, authorize('admin'), sessionController.getActiveSessions);
sessionRouter.post('/logout-all-devices', protect, sessionController.logoutAllDevices);
sessionRouter.post('/account-lock-status', sessionController.getAccountLockStatus);
sessionRouter.post('/:userId/unlock-account', protect, authorize('admin'), sessionController.unlockAccount);

module.exports = sessionRouter;

// ==================== ADMIN ROUTES ====================
// banking-app-backend/routes/adminRoutes.js
const adminRouter = express.Router();

// Apply admin auth to all admin routes
adminRouter.use(protect, authorize('admin'));

// User management
adminRouter.get('/users', async (req, res) => {
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
adminRouter.get('/transactions', async (req, res) => {
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

// System statistics
adminRouter.get('/statistics', async (req, res) => {
  try {
    const User = require('../models/User');
    const Account = require('../models/Account');
    const Transaction = require('../models/Transaction');
    const Loan = require('../models/Loan');

    const totalUsers = await User.countDocuments();
    const totalAccounts = await Account.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const totalLoans = await Loan.countDocuments();

    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    const totalTransactionAmount = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        totalAccounts,
        totalTransactions,
        totalTransactionAmount: totalTransactionAmount[0]?.total || 0,
        totalLoans,
        loanStatus: {
          pending: await Loan.countDocuments({ status: 'pending' }),
          approved: await Loan.countDocuments({ status: 'approved' }),
          active: await Loan.countDocuments({ status: 'active' }),
          closed: await Loan.countDocuments({ status: 'closed' }),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

module.exports = adminRouter;