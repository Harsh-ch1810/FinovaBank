// backend/controllers/finanovaCashController.js
const FinovaCash = require('../models/FinovaCash');
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

// ==================== WITHDRAWAL ====================
exports.withdrawCash = async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      withdrawalMode, // atm, branch, home-delivery
      description,
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Validate amount
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹100',
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

    // Create withdrawal record
    const reference = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const withdrawal = new FinovaCash({
      userId,
      accountNumber: account.accountNumber,
      transactionType: 'withdrawal',
      amount,
      paymentMethod,
      withdrawalMode,
      description: description || 'Cash Withdrawal',
      reference,
      status: withdrawalMode === 'home-delivery' ? 'processing' : 'completed',
      balanceAfter: account.balance - amount,
    });

    await withdrawal.save();

    // Deduct amount from account
    account.balance -= amount;
    await account.save();

    // Send email notification
    const user = await User.findById(userId);
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '💸 Cash Withdrawal Initiated',
        html: `
          <h2>Cash Withdrawal Initiated</h2>
          <p>Hi ${user.firstName},</p>
          <p><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
          <p><strong>Mode:</strong> ${withdrawalMode === 'home-delivery' ? 'Home Delivery' : withdrawalMode.toUpperCase()}</p>
          <p><strong>Status:</strong> ${withdrawal.status === 'processing' ? 'Processing' : 'Ready for Pickup'}</p>
          <p><strong>Reference:</strong> ${reference}</p>
          <p><strong>New Balance:</strong> ₹${account.balance.toLocaleString('en-IN')}</p>
        `,
      });
    } catch (emailError) {
      console.warn('Email notification failed');
    }

    res.status(201).json({
      success: true,
      message: `Cash withdrawal ${withdrawal.status === 'processing' ? 'initiated' : 'completed'}`,
      withdrawal: {
        reference,
        amount,
        mode: withdrawalMode,
        status: withdrawal.status,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Withdrawal failed',
    });
  }
};

// ==================== DEPOSIT ====================
exports.depositCash = async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      depositMode, // branch, atm, cheque
      chequeNumber,
      chequeBank,
      description,
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Validate amount
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum deposit amount is ₹100',
      });
    }

    // Check account
    const account = await Account.findOne({ userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Create deposit record
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const deposit = new FinovaCash({
      userId,
      accountNumber: account.accountNumber,
      transactionType: 'deposit',
      amount,
      paymentMethod,
      depositMode,
      chequeNumber: depositMode === 'cheque' ? chequeNumber : undefined,
      chequeBank: depositMode === 'cheque' ? chequeBank : undefined,
      description: description || 'Cash Deposit',
      reference,
      status: depositMode === 'cheque' ? 'processing' : 'completed',
      balanceAfter: account.balance + amount,
    });

    await deposit.save();

    // Add amount to account
    account.balance += amount;
    await account.save();

    // Send email notification
    const user = await User.findById(userId);
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '💰 Cash Deposit Received',
        html: `
          <h2>Cash Deposit Received</h2>
          <p>Hi ${user.firstName},</p>
          <p><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
          <p><strong>Mode:</strong> ${depositMode.toUpperCase()}</p>
          <p><strong>Status:</strong> ${deposit.status === 'processing' ? 'Being Processed' : 'Credited'}</p>
          <p><strong>Reference:</strong> ${reference}</p>
          <p><strong>New Balance:</strong> ₹${account.balance.toLocaleString('en-IN')}</p>
        `,
      });
    } catch (emailError) {
      console.warn('Email notification failed');
    }

    res.status(201).json({
      success: true,
      message: `Deposit ${deposit.status === 'processing' ? 'received and being processed' : 'credited successfully'}`,
      deposit: {
        reference,
        amount,
        mode: depositMode,
        status: deposit.status,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Deposit failed',
    });
  }
};

// ==================== GET CASH TRANSACTIONS ====================
exports.getCashTransactions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type } = req.query; // 'withdrawal', 'deposit', or 'all'

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    let query = { userId };
    if (type && type !== 'all') {
      query.transactionType = type;
    }

    const transactions = await FinovaCash.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
};

// ==================== GET TRANSACTION DETAILS ====================
exports.getTransactionDetails = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user?.id;

    const transaction = await FinovaCash.findOne({ reference, userId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
    });
  }
};