// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/verify-aadhaar', authController.verifyAadhaar);

// Forgot Password Routes
router.post('/forgot-password/security-question', authController.getSecurityQuestion);
router.post('/forgot-password/reset', authController.resetPasswordWithAnswer);

// Protected routes
router.get('/me', auth, authController.getCurrentUser);
router.get('/profile', auth, authController.getCurrentUser);

module.exports = router;