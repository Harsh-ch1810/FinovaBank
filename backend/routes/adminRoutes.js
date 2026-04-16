// backend/routes/adminRoutes.js - ADMIN ROUTES
const express = require('express');
const router = express.Router();

const adminAuthController = require('../controllers/adminAuthController');
const adminRequestsController = require('../controllers/adminRequestsController');
const { protectAdmin, requireSuperAdmin, requirePermission } = require('../middleware/adminAuth');

console.log('✅ Admin Routes Loading');

// ==================== AUTHENTICATION ROUTES ====================
// Public - Admin Login
router.post('/login', adminAuthController.adminLogin);

// Protected - Admin Profile
router.get('/profile', protectAdmin, adminAuthController.getAdminProfile);
router.put('/profile/update', protectAdmin, adminAuthController.updateAdminProfile);
router.post('/profile/change-password', protectAdmin, adminAuthController.changeAdminPassword);
router.post('/logout', protectAdmin, adminAuthController.adminLogout);

// Super Admin Only - Create Admin & Get All Admins
router.post('/create', protectAdmin, requireSuperAdmin, adminAuthController.createAdmin);
router.get('/all', protectAdmin, requireSuperAdmin, adminAuthController.getAllAdmins);

// ==================== REQUEST MANAGEMENT ROUTES ====================
// Get all requests (with filters)
router.get('/requests', protectAdmin, adminRequestsController.getAllRequests);

// Get pending requests
router.get('/requests/pending', protectAdmin, adminRequestsController.getPendingRequests);

// Get specific request details
router.get('/requests/:requestId', protectAdmin, adminRequestsController.getRequestDetails);

// Approve request
router.post(
  '/requests/:requestId/approve',
  protectAdmin,
  requirePermission('canManageUsers'),
  adminRequestsController.approveRequest
);

// Reject request
router.post(
  '/requests/:requestId/reject',
  protectAdmin,
  requirePermission('canManageUsers'),
  adminRequestsController.rejectRequest
);

// Mark request as under review
router.post(
  '/requests/:requestId/under-review',
  protectAdmin,
  adminRequestsController.markUnderReview
);

// ==================== USER REQUEST CREATION (USER SIDE) ====================
// Users create requests (not admin-protected)
router.post('/requests/create', adminRequestsController.createRequest);

// Get user's own requests
router.get('/my-requests', adminRequestsController.getUserRequests);

module.exports = router;