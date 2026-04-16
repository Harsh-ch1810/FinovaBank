// backend/controllers/transactionController.js

const Transaction = require('../models/Transaction');
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

// ==================== SEND MONEY ====================
exports.sendMoney = async (req, res) => {
  try {
    let { receiverAccountNumber, amount, description } = req.body;

    if (!receiverAccountNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Receiver account and amount required',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    const normalizedAccountNumber = receiverAccountNumber.trim();

    // Get sender account
    const senderAccount = await Account.findOne({ userId: req.user.id });

    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        message: 'Your account not found',
      });
    }

    // Case-insensitive receiver search
    const receiverAccount = await Account.findOne({
      accountNumber: {
        $regex: `^${normalizedAccountNumber}$`,
        $options: 'i',
      },
    });

    if (!receiverAccount) {
      return res.status(404).json({
        success: false,
        message: 'Receiver account not found',
      });
    }

    // Prevent self transfer
    if (senderAccount._id.toString() === receiverAccount._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to your own account',
      });
    }

    // Balance check
    if (senderAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    // Get users
    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(receiverAccount.userId);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate reference
    const reference = `TXN${Date.now()}`;

    // Create transaction
    const transaction = new Transaction({
      senderId: req.user.id,
      senderAccountId: senderAccount._id,
      senderAccountNumber: senderAccount.accountNumber,

      receiverId: receiverAccount.userId,
      receiverAccountId: receiverAccount._id,
      receiverAccountNumber: receiverAccount.accountNumber,

      amount,
      transactionType: 'transfer',
      description: description || 'Money Transfer',
      reference,
      status: 'completed',
    });

    await transaction.save();

    // Update balances
    await senderAccount.deductAmount(amount);
    await receiverAccount.addAmount(amount);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Money transferred successfully',
      transaction: transaction.getTransactionSummary(),
    });

  } catch (error) {
    console.error('❌ Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer failed',
      error: error.message,
    });
  }
};

// ==================== GET HISTORY ====================
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id.toString();

    const transactions = await Transaction.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate('senderId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort({ createdAt: -1 });

    const formattedTransactions = transactions.map((txn) => {
      const senderName = txn.senderId
        ? `${txn.senderId.firstName} ${txn.senderId.lastName}`
        : 'Unknown User';

      const receiverName = txn.receiverId
        ? `${txn.receiverId.firstName} ${txn.receiverId.lastName}`
        : 'Unknown User';

      // 🔥 CORRECT SENT / RECEIVED LOGIC
      const isSent =
        txn.senderId &&
        txn.senderId._id.toString() === userId;

      return {
        reference: txn.reference,
        amount: txn.amount,
        status: txn.status || 'completed',
        createdAt: txn.createdAt,
        senderName,
        receiverName,
        isSent,
      };
    });

    res.status(200).json({
      success: true,
      transactions: formattedTransactions,
    });

  } catch (error) {
    console.error('❌ History error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
    });
  }
};

// ==================== GET SINGLE TRANSACTION ====================
exports.getDetails = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      reference: req.params.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      transaction: transaction.getTransactionSummary(),
    });

  } catch (error) {
    console.error('❌ Fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
    });
  }
};