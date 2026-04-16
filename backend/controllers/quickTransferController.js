// backend/controllers/quickTransferController.js
const QuickTransfer = require('../models/QuickTransfer');
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

// ==================== CREATE QUICK TRANSFER ====================
exports.createQuickTransfer = async (req, res) => {
  try {
    const {
      beneficiaryName,
      beneficiaryAccountNumber,
      amount,
      transferType,
      purpose,
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Validate amount
    if (amount <= 0 || amount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between ₹1 and ₹50,000',
      });
    }

    // Check account balance
    const account = await Account.findOne({ userId });
    if (!account || account.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    // Create quick transfer record
    const transactionId = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const quickTransfer = new QuickTransfer({
      userId,
      beneficiaryName,
      beneficiaryAccountNumber,
      amount,
      transferType,
      purpose: purpose || 'Quick Transfer',
      transactionId,
      status: 'completed',
    });

    await quickTransfer.save();

    // Deduct amount from account
    account.balance -= amount;
    await account.save();

    // Send email notification
    const user = await User.findById(userId);
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '✅ Quick Transfer Completed',
        html: `
          <h2>Quick Transfer Successful</h2>
          <p>Hi ${user.firstName},</p>
          <p><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
          <p><strong>To:</strong> ${beneficiaryName}</p>
          <p><strong>Account:</strong> ${beneficiaryAccountNumber}</p>
          <p><strong>Reference:</strong> ${transactionId}</p>
          <p><strong>Remaining Balance:</strong> ₹${account.balance.toLocaleString('en-IN')}</p>
        `,
      });
    } catch (emailError) {
      console.warn('Email notification failed');
    }

    res.status(201).json({
      success: true,
      message: 'Quick transfer completed successfully',
      transfer: {
        transactionId,
        amount,
        beneficiaryName,
        status: 'completed',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Quick transfer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Quick transfer failed',
    });
  }
};

// ==================== GET QUICK TRANSFER HISTORY ====================
exports.getQuickTransferHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const transfers = await QuickTransfer.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      transfers,
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfers',
    });
  }
};

// ==================== GET SAVED BENEFICIARIES ====================
exports.getSavedBeneficiaries = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Get unique beneficiaries from transfer history
    const transfers = await QuickTransfer.find({ userId, savedBeneficiary: true })
      .select('beneficiaryName beneficiaryAccountNumber')
      .sort({ createdAt: -1 });

    // Remove duplicates
    const uniqueBeneficiaries = [];
    const seen = new Set();

    for (const transfer of transfers) {
      const key = transfer.beneficiaryAccountNumber;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBeneficiaries.push(transfer);
      }
    }

    res.status(200).json({
      success: true,
      beneficiaries: uniqueBeneficiaries,
    });
  } catch (error) {
    console.error('Error fetching beneficiaries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beneficiaries',
    });
  }
};

// ==================== VERIFY BENEFICIARY ====================
exports.verifyBeneficiary = async (req, res) => {
  try {
    const { accountNumber } = req.body;

    // Check if account exists
    const account = await Account.findOne({ accountNumber }).populate('userId');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const user = account.userId;

    res.status(200).json({
      success: true,
      beneficiary: {
        accountNumber,
        name: user.getFullName(),
        accountType: account.accountType,
        verified: true,
      },
    });
  } catch (error) {
    console.error('Error verifying beneficiary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify beneficiary',
    });
  }
};