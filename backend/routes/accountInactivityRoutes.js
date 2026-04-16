// banking-app-backend/routes/accountInactivityRoutes.js
const express = require('express');
const {
  trackActivity,
  getInactivityStatus,
  getInactivityDetails,
  sendFirstWarningEmail,
  sendSecondWarningEmail,
  sendThirdWarningEmail,
  sendFinalNotice,
  generateReactivationCode,
  verifyReactivationCode,
  blockAccountAdmin,
  unblockAccountAdmin,
  getInactiveAccountsAdmin,
} = require('../controllers/accountInactivityController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ==================== USER ROUTES ====================

// Track activity
router.post('/track-activity', protect, trackActivity);

// Get inactivity status
router.get('/status', protect, getInactivityStatus);

// Get detailed inactivity information
router.get('/details', protect, getInactivityDetails);

// Generate reactivation code
router.post('/generate-reactivation-code', protect, generateReactivationCode);

// Verify reactivation code
router.post('/verify-reactivation-code', protect, verifyReactivationCode);

// ==================== ADMIN ROUTES ====================

// Send first warning email
router.post('/send-first-warning', protect, authorize('admin'), sendFirstWarningEmail);

// Send second warning email
router.post('/send-second-warning', protect, authorize('admin'), sendSecondWarningEmail);

// Send third warning email
router.post('/send-third-warning', protect, authorize('admin'), sendThirdWarningEmail);

// Send final notice
router.post('/send-final-notice', protect, authorize('admin'), sendFinalNotice);

// Block account (admin)
router.post('/admin/block-account/:userId', protect, authorize('admin'), blockAccountAdmin);

// Unblock account (admin)
router.post('/admin/unblock-account/:userId', protect, authorize('admin'), unblockAccountAdmin);

// Get all inactive accounts (admin)
router.get('/admin/inactive-accounts', protect, authorize('admin'), getInactiveAccountsAdmin);

module.exports = router;