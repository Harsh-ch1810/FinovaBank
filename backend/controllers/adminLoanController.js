// backend/controllers/adminLoanController.js - ADMIN LOAN MANAGEMENT
const Loan = require('../models/Loan');
const User = require('../models/User');
const Account = require('../models/Account');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log('✅ Admin Loan Controller Loaded');

// ==================== GET ALL LOANS ====================
exports.getAllLoans = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const loans = await Loan.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Format loans for frontend
    const formattedLoans = loans.map(loan => ({
      _id: loan._id,
      userId: loan.userId?._id,
      userName: loan.userId ? `${loan.userId.firstName} ${loan.userId.lastName}` : 'Unknown',
      userEmail: loan.userId?.email || 'Unknown',
      amount: loan.amount,
      tenureMonths: loan.tenureMonths,
      monthlyEMI: loan.monthlyEMI,
      loanType: loan.loanType,
      purpose: loan.purpose,
      interestRate: loan.interestRate,
      totalPayable: loan.totalPayable,
      status: loan.status,
      rejectionReason: loan.rejectionReason,
      approvalDate: loan.approvalDate,
      createdAt: loan.createdAt,
    }));

    console.log('✅ Fetched', formattedLoans.length, 'loans');

    res.status(200).json({
      success: true,
      loans: formattedLoans,
      count: formattedLoans.length,
    });
  } catch (error) {
    console.error('❌ Error fetching loans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error.message,
    });
  }
};

// ==================== GET LOAN DETAILS ====================
exports.getLoanDetails = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId).populate('userId', 'firstName lastName email');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    const formattedLoan = {
      _id: loan._id,
      userId: loan.userId?._id,
      userName: loan.userId ? `${loan.userId.firstName} ${loan.userId.lastName}` : 'Unknown',
      userEmail: loan.userId?.email || 'Unknown',
      amount: loan.amount,
      tenureMonths: loan.tenureMonths,
      monthlyEMI: loan.monthlyEMI,
      loanType: loan.loanType,
      purpose: loan.purpose,
      interestRate: loan.interestRate,
      totalPayable: loan.totalPayable,
      status: loan.status,
      rejectionReason: loan.rejectionReason,
      approvalDate: loan.approvalDate,
      createdAt: loan.createdAt,
    };

    res.status(200).json({
      success: true,
      loan: formattedLoan,
    });
  } catch (error) {
    console.error('❌ Error fetching loan details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan details',
      error: error.message,
    });
  }
};

// ==================== APPROVE LOAN ====================
exports.approveLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { approvalReason } = req.body;

    console.log('✅ Approving loan:', loanId);

    const loan = await Loan.findById(loanId).populate('userId', 'firstName lastName email');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Loan is already ${loan.status}`,
      });
    }

    // Approve loan
    loan.approve();
    await loan.save();

    const user = loan.userId;

    // ✅ SEND EMAIL NOTIFICATION TO USER
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '✅ Loan Approved - Finova Bank',
        html: `
          <h2>Great News! Your Loan is Approved</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your ${loan.loanType} loan application has been <strong>APPROVED</strong>!</p>
          
          <h3>Loan Details:</h3>
          <ul>
            <li><strong>Loan Amount:</strong> ₹${loan.amount.toLocaleString('en-IN')}</li>
            <li><strong>Loan Type:</strong> ${loan.loanType}</li>
            <li><strong>Interest Rate:</strong> ${loan.interestRate}% p.a.</li>
            <li><strong>Tenure:</strong> ${loan.tenureMonths} months</li>
            <li><strong>Monthly EMI:</strong> ₹${loan.monthlyEMI.toLocaleString('en-IN')}</li>
            <li><strong>Total Payable:</strong> ₹${loan.totalPayable.toLocaleString('en-IN')}</li>
          </ul>

          <p><strong>Purpose:</strong> ${loan.purpose || 'Not specified'}</p>
          
          <p>The loan amount will be disbursed to your account within 2-3 business days.</p>
          
          <p>Thank you for choosing Finova Bank!</p>
          
          <p><em>If you have any questions, please contact our support team.</em></p>
        `,
      });
      console.log('📧 Approval email sent to:', user.email);
    } catch (emailError) {
      console.warn('⚠️ Email sending failed:', emailError.message);
    }

    console.log('✅ Loan approved successfully');

    res.status(200).json({
      success: true,
      message: 'Loan approved successfully!',
      loan: {
        _id: loan._id,
        status: loan.status,
        monthlyEMI: loan.monthlyEMI,
      },
    });
  } catch (error) {
    console.error('❌ Error approving loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve loan',
      error: error.message,
    });
  }
};

// ==================== REJECT LOAN ====================
exports.rejectLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { rejectionReason } = req.body;

    console.log('❌ Rejecting loan:', loanId);

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const loan = await Loan.findById(loanId).populate('userId', 'firstName lastName email');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Loan is already ${loan.status}`,
      });
    }

    // Reject loan
    loan.reject(rejectionReason);
    await loan.save();

    const user = loan.userId;

    // ✅ SEND EMAIL NOTIFICATION TO USER
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '❌ Loan Application Rejected - Finova Bank',
        html: `
          <h2>Loan Application Update</h2>
          <p>Hi ${user.firstName},</p>
          <p>Unfortunately, your ${loan.loanType} loan application has been <strong>REJECTED</strong>.</p>
          
          <h3>Loan Details:</h3>
          <ul>
            <li><strong>Loan Amount:</strong> ₹${loan.amount.toLocaleString('en-IN')}</li>
            <li><strong>Loan Type:</strong> ${loan.loanType}</li>
            <li><strong>Purpose:</strong> ${loan.purpose || 'Not specified'}</li>
          </ul>

          <h3>Rejection Reason:</h3>
          <p><strong>${rejectionReason}</strong></p>
          
          <p>You may reapply after addressing the concerns mentioned above.</p>
          <p>For more information or to discuss this further, please contact our support team.</p>
          
          <p>We appreciate your interest in Finova Bank!</p>
        `,
      });
      console.log('📧 Rejection email sent to:', user.email);
    } catch (emailError) {
      console.warn('⚠️ Email sending failed:', emailError.message);
    }

    console.log('✅ Loan rejected successfully');

    res.status(200).json({
      success: true,
      message: 'Loan rejected successfully!',
      loan: {
        _id: loan._id,
        status: loan.status,
        rejectionReason: loan.rejectionReason,
      },
    });
  } catch (error) {
    console.error('❌ Error rejecting loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject loan',
      error: error.message,
    });
  }
};

// ==================== DISBURSE LOAN ====================
exports.disburseLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    console.log('💰 Disbursing loan:', loanId);

    const loan = await Loan.findById(loanId).populate('userId');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    if (loan.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved loans can be disbursed',
      });
    }

    // Disburse loan
    loan.disburse();

    // Add amount to user account
    const account = await Account.findOne({ userId: loan.userId._id });
    if (account) {
      await account.addAmount(loan.amount);
    }

    await loan.save();

    // ✅ SEND EMAIL NOTIFICATION TO USER
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: loan.userId.email,
        subject: '💰 Loan Disbursed - Finova Bank',
        html: `
          <h2>Loan Disbursed Successfully</h2>
          <p>Hi ${loan.userId.firstName},</p>
          <p>Your loan has been <strong>DISBURSED</strong> to your account!</p>
          
          <h3>Disbursement Details:</h3>
          <ul>
            <li><strong>Amount:</strong> ₹${loan.amount.toLocaleString('en-IN')}</li>
            <li><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</li>
            <li><strong>Monthly EMI:</strong> ₹${loan.monthlyEMI.toLocaleString('en-IN')}</li>
          </ul>

          <p>EMI payments will begin from next month.</p>
          
          <p>Thank you for banking with Finova Bank!</p>
        `,
      });
    } catch (emailError) {
      console.warn('⚠️ Email sending failed:', emailError.message);
    }

    console.log('✅ Loan disbursed successfully');

    res.status(200).json({
      success: true,
      message: 'Loan disbursed successfully!',
      loan: {
        _id: loan._id,
        status: loan.status,
        disbursedAmount: loan.disbursedAmount,
      },
    });
  } catch (error) {
    console.error('❌ Error disbursing loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disburse loan',
      error: error.message,
    });
  }
};