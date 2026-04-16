// backend/routes/adminLoans.js - CUSTOM FOR YOUR PROJECT
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Loan = require('../models/Loan');

// =====================================================
// ALL ROUTES PROTECTED - ADMIN ONLY
// =====================================================

// @route   GET /api/admin/loans
// @desc    Get all loans with optional status filter
// @access  Private/Admin
router.get('/loans', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;

    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('📋 Admin fetching loans with query:', query);

    // Fetch loans from database
    const loans = await Loan.find(query)
      .populate('userId', 'firstName lastName email aadhaar')
      .populate('accountId', 'accountNumber balance')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${loans.length} loans`);

    // Format response to match frontend expectations
    const formattedLoans = loans.map(loan => ({
      _id: loan._id,
      userId: loan.userId?._id,
      userName: loan.userId ? `${loan.userId.firstName} ${loan.userId.lastName}` : 'Unknown',
      userEmail: loan.userId?.email,
      accountId: loan.accountId?._id,
      amount: loan.amount,
      loanType: loan.loanType,
      purpose: loan.purpose,
      tenureMonths: loan.tenureMonths,
      interestRate: loan.interestRate,
      monthlyEMI: loan.monthlyEMI,
      totalPayable: loan.totalPayable,
      status: loan.status,
      approvalDate: loan.approvalDate,
      rejectionReason: loan.rejectionReason,
      disbursedAmount: loan.disbursedAmount,
      amountPaid: loan.amountPaid,
      remainingAmount: loan.remainingAmount,
      emisPaid: loan.emisPaid,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    }));

    return res.json({
      success: true,
      loans: formattedLoans,
      count: formattedLoans.length,
      message: `${formattedLoans.length} loans fetched successfully`,
    });
  } catch (error) {
    console.error('❌ Error fetching loans:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/loans/:id
// @desc    Get single loan details
// @access  Private/Admin
router.get('/loans/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📄 Fetching loan details for ID:', id);

    const loan = await Loan.findById(id)
      .populate('userId', 'firstName lastName email aadhaar phoneNumber')
      .populate('accountId', 'accountNumber accountType balance');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    // Format response
    const formattedLoan = {
      _id: loan._id,
      userId: loan.userId?._id,
      userName: loan.userId ? `${loan.userId.firstName} ${loan.userId.lastName}` : 'Unknown',
      userEmail: loan.userId?.email,
      userPhone: loan.userId?.phoneNumber,
      userAadhaar: loan.userId?.aadhaar,
      accountId: loan.accountId?._id,
      accountNumber: loan.accountId?.accountNumber,
      accountType: loan.accountId?.accountType,
      amount: loan.amount,
      loanType: loan.loanType,
      purpose: loan.purpose,
      tenureMonths: loan.tenureMonths,
      interestRate: loan.interestRate,
      monthlyEMI: loan.monthlyEMI,
      totalPayable: loan.totalPayable,
      status: loan.status,
      approvalDate: loan.approvalDate,
      rejectionReason: loan.rejectionReason,
      disbursedAmount: loan.disbursedAmount,
      amountPaid: loan.amountPaid,
      remainingAmount: loan.remainingAmount,
      emisPaid: loan.emisPaid,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    };

    return res.json({
      success: true,
      loan: formattedLoan,
      message: 'Loan details fetched successfully',
    });
  } catch (error) {
    console.error('❌ Error fetching loan details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch loan details',
      error: error.message,
    });
  }
});

// @route   POST /api/admin/loans/:id/approve
// @desc    Approve a loan
// @access  Private/Admin
router.post('/loans/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalReason } = req.body;

    console.log('✅ Admin approving loan:', id);

    // Check if loan exists
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    // Check if already processed
    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Loan is already ${loan.status}. Cannot approve.`,
      });
    }

    // Approve the loan
    loan.approve();

    // Save changes
    await loan.save();

    console.log('✅ Loan approved:', id);

    // TODO: Send email notification to user
    // await sendApprovalEmail(loan.userId.email, loan);

    return res.json({
      success: true,
      loan: loan,
      message: '✅ Loan approved successfully. User will be notified.',
    });
  } catch (error) {
    console.error('❌ Error approving loan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve loan',
      error: error.message,
    });
  }
});

// @route   POST /api/admin/loans/:id/reject
// @desc    Reject a loan
// @access  Private/Admin
router.post('/loans/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    console.log('❌ Admin rejecting loan:', id);

    // Validate rejection reason
    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    // Check if loan exists
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    // Check if already processed
    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Loan is already ${loan.status}. Cannot reject.`,
      });
    }

    // Reject the loan
    loan.reject(rejectionReason);

    // Save changes
    await loan.save();

    console.log('✅ Loan rejected:', id);

    // TODO: Send email notification to user
    // await sendRejectionEmail(loan.userId.email, loan);

    return res.json({
      success: true,
      loan: loan,
      message: '✅ Loan rejected successfully. User will be notified.',
    });
  } catch (error) {
    console.error('❌ Error rejecting loan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject loan',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/loans/stats
// @desc    Get loan statistics
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    const pending = stats.find(s => s._id === 'pending') || { count: 0, totalAmount: 0 };
    const approved = stats.find(s => s._id === 'approved') || { count: 0, totalAmount: 0 };
    const rejected = stats.find(s => s._id === 'rejected') || { count: 0, totalAmount: 0 };
    const active = stats.find(s => s._id === 'active') || { count: 0, totalAmount: 0 };

    const total = await Loan.countDocuments();

    return res.json({
      success: true,
      stats: {
        total,
        pending: pending.count,
        approved: approved.count,
        rejected: rejected.count,
        active: active.count,
        totalPendingAmount: pending.totalAmount || 0,
        totalApprovedAmount: approved.totalAmount || 0,
      },
      message: 'Loan statistics fetched',
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/health
// @desc    Health check endpoint
// @access  Public
router.get('/health', (req, res) => {
  return res.json({
    success: true,
    message: '✅ Backend is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;