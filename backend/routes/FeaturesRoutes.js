// backend/routes/newFeaturesRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const quickTransferController = require('../controllers/quickTransferController');
const finanovaCashController = require('../controllers/finanovaCashController');
const insuranceController = require('../controllers/insuranceController');

// ==================== QUICK TRANSFER ROUTES ====================
router.post('/quick-transfer', auth, quickTransferController.createQuickTransfer);
router.get('/quick-transfer/history', auth, quickTransferController.getQuickTransferHistory);
router.get('/quick-transfer/beneficiaries', auth, quickTransferController.getSavedBeneficiaries);
router.post('/quick-transfer/verify-beneficiary', auth, quickTransferController.verifyBeneficiary);

// ==================== FINOVA CASH ROUTES ====================
router.post('/finova-cash/withdrawal', auth, finanovaCashController.withdrawCash);
router.post('/finova-cash/deposit', auth, finanovaCashController.depositCash);
router.get('/finova-cash/transactions', auth, finanovaCashController.getCashTransactions);
router.get('/finova-cash/transactions/:reference', auth, finanovaCashController.getTransactionDetails);

// ==================== INSURANCE ROUTES ====================
router.post('/insurance/buy', auth, insuranceController.buyInsurance);
router.get('/insurance/my-policies', auth, insuranceController.getMyPolicies);
router.get('/insurance/policy/:policyNumber', auth, insuranceController.getPolicyDetails);
router.post('/insurance/file-claim', auth, insuranceController.fileClaim);
router.post('/insurance/pay-premium', auth, insuranceController.payPremium);
router.get('/insurance/plans', insuranceController.getInsurancePlans);
router.get('/insurance/plans/:type', insuranceController.getInsurancePlans);

module.exports = router;