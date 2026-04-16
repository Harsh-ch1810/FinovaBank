// banking-app-backend/controllers/loanController.js
const Loan = require('../models/Loan');
const Account = require('../models/Account');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// @desc    Apply for loan
// @route   POST /api/loan/apply
// @access  Private
exports.applyLoan = async (req, res) => {
  try {
    const { loanType, amount, tenureMonths, purpose } = req.body;

    if (!loanType || !amount || !tenureMonths) {
      return res.status(400).json({
        success: false,
        message: 'All fields required',
      });
    }

    const account = await Account.findOne({ userId: req.user.id });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Create loan
    const loan = new Loan({
      userId: req.user.id,
      accountId: account._id,
      loanType,
      amount,
      tenureMonths,
      purpose,
    });

    // Calculate EMI
    loan.calculateEMI();

    await loan.save();

    // Send confirmation email
    const user = await User.findById(req.user.id);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Loan Application Submitted',
      html: `
        <h3>Loan Application Received</h3>
        <p>Dear ${user.firstName},</p>
        <p>Your loan application has been submitted successfully.</p>
        <p><strong>Application Details:</strong></p>
        <ul>
          <li>Type: ${loanType} Loan</li>
          <li>Amount: ₹${amount}</li>
          <li>Tenure: ${tenureMonths} months</li>
          <li>Monthly EMI: ₹${loan.monthlyEMI}</li>
          <li>Total Payable: ₹${loan.totalPayable}</li>
          <li>Status: Pending Review</li>
        </ul>
        <p>We will review your application and notify you within 2-3 business days.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted',
      loan: {
        id: loan._id,
        type: loan.loanType,
        amount: loan.amount,
        monthlyEMI: loan.monthlyEMI,
        totalPayable: loan.totalPayable,
        status: loan.status,
      },
    });
  } catch (error) {
    console.error('Loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Loan application failed',
      error: error.message,
    });
  }
};

// @desc    Get user loans
// @route   GET /api/loan/my-loans
// @access  Private
exports.getUserLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      loans: loans.map((loan) => ({
        id: loan._id,
        type: loan.loanType,
        amount: loan.amount,
        monthlyEMI: loan.monthlyEMI,
        totalPayable: loan.totalPayable,
        amountPaid: loan.amountPaid,
        remainingAmount: loan.remainingAmount,
        emisPaid: loan.emisPaid,
        status: loan.status,
        createdAt: loan.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error.message,
    });
  }
};

// @desc    Get loan details
// @route   GET /api/loan/:id
// @access  Private
exports.getLoanDetails = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    if (loan.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.status(200).json({
      success: true,
      loan: {
        id: loan._id,
        type: loan.loanType,
        amount: loan.amount,
        interestRate: loan.interestRate,
        tenureMonths: loan.tenureMonths,
        monthlyEMI: loan.monthlyEMI,
        totalPayable: loan.totalPayable,
        amountPaid: loan.amountPaid,
        remainingAmount: loan.remainingAmount,
        emisPaid: loan.emisPaid,
        status: loan.status,
        approvalDate: loan.approvalDate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan',
      error: error.message,
    });
  }
};

// @desc    Admin: Approve loan
// @route   POST /api/loan/:id/approve
// @access  Private (Admin)
exports.approveLoan = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can approve',
      });
    }

    const loan = await Loan.findById(req.params.id).populate('userId');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    loan.approve();
    await loan.save();

    // Send approval email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: loan.userId.email,
      subject: 'Loan Approved!',
      html: `
        <h3>Loan Approved ✓</h3>
        <p>Dear ${loan.userId.firstName},</p>
        <p>Your loan application has been approved!</p>
        <p><strong>Approved Details:</strong></p>
        <ul>
          <li>Amount: ₹${loan.amount}</li>
          <li>Monthly EMI: ₹${loan.monthlyEMI}</li>
          <li>Tenure: ${loan.tenureMonths} months</li>
        </ul>
        <p>The amount will be disbursed within 2 business days.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Loan approved',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Approval failed',
      error: error.message,
    });
  }
};

// @desc    Admin: Reject loan
// @route   POST /api/loan/:id/reject
// @access  Private (Admin)
exports.rejectLoan = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can reject',
      });
    }

    const { reason } = req.body;

    const loan = await Loan.findById(req.params.id).populate('userId');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found',
      });
    }

    loan.reject(reason);
    await loan.save();

    // Send rejection email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: loan.userId.email,
      subject: 'Loan Application Status',
      html: `
        <h3>Loan Application Decision</h3>
        <p>Dear ${loan.userId.firstName},</p>
        <p>Your loan application has been rejected.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You can reapply after 30 days or contact support.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Loan rejected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Rejection failed',
      error: error.message,
    });
  }
};

// @desc    Calculate EMI (for estimation)
// @route   POST /api/loan/calculate-emi
// @access  Public
exports.calculateEMI = async (req, res) => {
  try {
    const { amount, tenureMonths, interestRate = 8.5 } = req.body;

    if (!amount || !tenureMonths) {
      return res.status(400).json({
        success: false,
        message: 'Amount and tenure required',
      });
    }

    // Calculate using formula
    const monthlyRate = interestRate / 12 / 100;
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const monthlyEMI = Math.round((amount * numerator) / denominator);
    const totalPayable = monthlyEMI * tenureMonths;
    const totalInterest = totalPayable - amount;

    res.status(200).json({
      success: true,
      emiCalculation: {
        amount,
        tenureMonths,
        interestRate,
        monthlyEMI,
        totalPayable,
        totalInterest,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Calculation failed',
      error: error.message,
    });
  }
};