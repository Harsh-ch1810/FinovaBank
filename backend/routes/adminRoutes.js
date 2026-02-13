const express = require('express');
const {
  getAllUsers,
  getAllTransactions,
  getAllLoans,
  approveLoan,
  rejectLoan,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.get('/transactions', getAllTransactions);
router.get('/loans', getAllLoans);
router.post('/loan/:id/approve', approveLoan);
router.post('/loan/:id/reject', rejectLoan);
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
